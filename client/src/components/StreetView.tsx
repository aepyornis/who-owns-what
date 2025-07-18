import React from "react";
import { withGoogleMap, StreetViewPanorama } from "react-google-maps";
import Browser from "../util/browser";
import Helpers from "../util/helpers";
import { FixedLoadingLabel } from "./Loader";

// The API for these streetview images is quite expensive, and the quality has
// been declining (now common to get images inside businesses etc) so we've
// decided to completely remove it from the site for now.

export type StreetViewAddr = {
  lat: number;
  lng: number;
};

export type StreetViewProps = {
  addr: StreetViewAddr | null | undefined;
};

type HeadingAndCoords = {
  heading: number;
  coordinates: google.maps.LatLng | undefined;
};

type State = HeadingAndCoords;

const UnwrappedStreetViewImpl: React.FC<HeadingAndCoords> = (props) => {
  return (
    <StreetViewPanorama
      visible
      defaultPosition={props.coordinates}
      position={props.coordinates}
      pov={{ heading: props.heading, pitch: 15 }}
      zoom={0.5}
      options={{
        disableDefaultUI: true,
        enableCloseButton: false,
        panControl: true,
        fullscreenControl: true,
      }}
    />
  );
};

const StreetViewImpl = withGoogleMap(UnwrappedStreetViewImpl);

const NULL_HEADING_AND_COORDS: HeadingAndCoords = {
  heading: 0,
  coordinates: undefined,
};

function getAddrHash(addr: StreetViewAddr | null | undefined): string {
  return addr ? `${addr.lat},${addr.lng}` : "";
}

export class StreetView extends React.Component<StreetViewProps, State> {
  _isMounted: boolean = false;
  _currAddrHash: string;

  constructor(props: StreetViewProps) {
    super(props);
    this._currAddrHash = getAddrHash(null);
    this.state = { ...NULL_HEADING_AND_COORDS };
  }

  componentDidMount() {
    this._isMounted = true;
    this.updateHeadingAndCoordinates();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  updateHeadingAndCoordinates() {
    const addrHash = getAddrHash(this.props.addr);
    if (addrHash === this._currAddrHash) {
      // Nothing changed, no need to recompute anything.
      return;
    }

    this._currAddrHash = addrHash;

    if (this.props.addr) {
      let coordinates = new window.google.maps.LatLng(this.props.addr.lat, this.props.addr.lng);
      let streetViewService = new window.google.maps.StreetViewService();

      streetViewService.getPanoramaByLocation(coordinates, 50, (panoData) => {
        if (!(this._isMounted && addrHash === this._currAddrHash)) return;
        if (panoData && panoData.location && panoData.location.latLng) {
          // this computes the street view heading
          // srsly tho google, why not point to the latlng automatically?
          let panoCoordinates = panoData.location.latLng;
          this.setState({
            heading: window.google.maps.geometry.spherical.computeHeading(
              panoCoordinates,
              coordinates
            ),
            coordinates: coordinates,
          });
        } else {
          this.setState(NULL_HEADING_AND_COORDS);
        }
      });
    } else {
      this.setState(NULL_HEADING_AND_COORDS);
    }
  }

  componentDidUpdate() {
    this.updateHeadingAndCoordinates();
  }

  render() {
    const { heading, coordinates } = this.state;
    const isMobile = Browser.isMobile();

    return (
      <StreetViewImpl
        heading={heading}
        coordinates={coordinates}
        containerElement={
          <div style={{ width: `100%`, height: `${isMobile ? "180px" : "300px"}` }} />
        }
        mapElement={<div style={{ height: "100%" }} />}
      />
    );
  }
}

export interface StreetViewStaticProps extends React.ComponentPropsWithoutRef<"img"> {
  lat: number;
  lng: number;
  imgHeight: (screenWidth?: number, screenHeight?: number) => number;
  imgWidth: (screenWidth?: number, screenHeight?: number) => number;
}

export const StreetViewStatic = React.forwardRef<HTMLImageElement, StreetViewStaticProps>(
  ({ lat, lng, imgHeight, imgWidth, ...props }, ref) => {
    const { width: screenWidth, height: screenHeight } = Helpers.useWindowSize();

    const [imgSize, setImgSize] = React.useState(
      `${imgWidth(screenWidth, screenHeight)}x${imgHeight(screenWidth, screenHeight)}`
    );

    React.useEffect(() => {
      setImgSize(`${imgWidth(screenWidth, screenHeight)}x${imgHeight(screenWidth, screenHeight)}`);
    }, [imgHeight, imgWidth, screenWidth, screenHeight]);

    return !screenWidth || !screenHeight ? (
      <FixedLoadingLabel />
    ) : (
      <img
        ref={ref}
        src={`https://maps.googleapis.com/maps/api/streetview?size=${imgSize}&location=${lat},${lng}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
        alt="Google Street View"
        {...props}
      />
    );
  }
);
