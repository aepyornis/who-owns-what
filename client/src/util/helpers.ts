import { defaultLocale, SupportedLocale } from "../i18n-base";
import { AddressRecord, HpdContactAddress, SearchAddressWithoutBbl } from "components/APIDataTypes";
import { reportError } from "error-reporting";
import { t } from "@lingui/macro";
import { I18n, MessageDescriptor } from "@lingui/core";
import React, { useEffect, useState, ChangeEvent } from "react";
import _ from "lodash";
import { AreaProperties } from "containers/DistrictAlertsPage";

const hpdComplaintTypeTranslations = new Map([
  ["DOOR/WINDOW", t`DOOR/WINDOW`],
  ["HEATING", t`HEATING`],
  ["STAIRS", t`STAIRS`],
  ["CONSTRUCTION", t`CONSTRUCTION`],
  ["JANITOR/SUPER", t`JANITOR/SUPER`],
  ["OUTSIDE BUILDING", t`OUTSIDE BUILDING`],
  ["BELL/BUZZER/INTERCOM", t`BELL/BUZZER/INTERCOM`],
  ["SEWAGE", t`SEWAGE`],
  ["FIRE-ESCAPE", t`FIRE ESCAPE`],
  ["SIGNAGE MISSING", t`SIGNAGE MISSING`],
  ["PESTS", t`PESTS`],
  ["MAILBOX", t`MAILBOX`],
  ["WINDOWS", t`WINDOWS`],
  ["ELEVATOR", t`ELEVATOR`],
  ["GARBAGE/RECYCLING STORAGE", t`GARBAGE/RECYCLING STORAGE`],
  ["CABINET", t`CABINET`],
  ["TENANT HARASSMENT", t`TENANT HARASSMENT`],
  ["WINDOW GUARDS", t`WINDOW GUARDS`],
  ["FLOOR", t`FLOOR`],
  ["PLUMBING", t`PLUMBING`],
  ["VENTILATION SYSTEM", t`VENTILATION SYSTEM`],
  ["MOLD", t`MOLD`],
  ["WATER LEAK", t`WATER LEAK`],
  ["ELECTRIC", t`ELECTRIC`],
  ["FLOORING/STAIRS", t`FLOORING/STAIRS`],
  ["PAINT/PLASTER", t`PAINT/PLASTER`],
  ["APPLIANCE", t`APPLIANCE`],
  ["NONCONST", t`NON-CONSTRUCTION`],
  ["CERAMIC-TILE", t`CERAMIC TILE`],
  ["COOKING GAS", t`COOKING GAS`],
  ["SAFETY", t`SAFETY`],
  ["HEAT/HOT WATER", t`HEAT/HOT WATER`],
  ["DOORS", t`DOORS`],
  ["LOCKS", t`LOCKS`],
  ["LINE OF TRAVEL", t`LINE OF TRAVEL`],
  ["PORCH/BALCONY", t`PORCH/BALCONY`],
  ["VENTILATORS", t`VENTILATORS`],
]);

const hpdContactTitleTranslations = new Map([
  ["HeadOfficer", t`Head Officer`],
  ["CorporateOwner", t`Corporate Owner`],
  ["IndividualOwner", t`Individual Owner`],
  ["JointOwner", t`Joint Owner`],
  ["SiteManager", t`Site Manager`],
  ["Agent", t`Agent`],
  ["Lessee", t`Lessee`],
  ["Officer", t`Officer`],
  ["Shareholder", t`Shareholder`],
  ["Corporation", t`Corporation`],
]);

export const longDateOptions = { year: "numeric", month: "short", day: "numeric" };
export const mediumDateOptions = { year: "numeric", month: "long" };
export const shortDateOptions = { month: "short" };

const areaTypeLabelTranslations = new Map([
  ["nta", t`Neighborhood`],
  ["census_tract", t`Census Tract`],
  ["coun_dist", t`City Council District`],
  ["community_dist", t`Community District`],
  ["assem_dist", t`State Assembly District`],
  ["stsen_dist", t`State Senate District`],
  ["zipcode", t`Zip Code`],
]);

// https://www.geeksforgeeks.org/how-to-detect-the-user-browser-safari-chrome-ie-firefox-and-opera-using-javascript/
export const getBrowserName = () => {
  const userAgentString = navigator.userAgent;
  let browserName = "";
  if (userAgentString.indexOf("OP") > -1) browserName = "Opera";
  else if (userAgentString.indexOf("Chrome") > -1) browserName = "Chrome";
  else if (userAgentString.indexOf("Firefox") > -1) browserName = "Firefox";
  else if (userAgentString.indexOf("Safari") > -1) browserName = "Safari";
  else if (userAgentString.indexOf("MSIE") > -1 || userAgentString.indexOf("rv:") > -1)
    browserName = "Internet Explorer";

  return browserName;
};

/**
 * Delay the action of a certian function by a set amount of time.
 *
 * Originally copied from:
 * https://gist.github.com/gragland/4e3d9b1c934a18dc76f585350f97e321#gistcomment-3073492
 */
const debounce = (delay: number, fn: any) => {
  let timerId: any;

  return function (...args: any[]) {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
};

const createTranslationFunctionFromMap = (
  map: Map<string, MessageDescriptor>,
  description: string,
  localeOverride?: SupportedLocale
) => (textToTranslate: string, i18n: I18n) => {
  const translatedType = map.get(textToTranslate);
  if (!translatedType) {
    reportError(`The ${description} "${textToTranslate}" isn't internationalized`);
    return textToTranslate;
  } else return i18n.use(localeOverride || i18n.language)._(translatedType);
};

const translateComplaintType = createTranslationFunctionFromMap(
  hpdComplaintTypeTranslations,
  "HPD Complaint type"
);
const translateContactTitle = createTranslationFunctionFromMap(
  hpdContactTitleTranslations,
  "HPD Contact title"
);
const getContactTitleInEnglish = createTranslationFunctionFromMap(
  hpdContactTitleTranslations,
  "HPD Contact title",
  "en"
);
const translateAreaTypeLabel = createTranslationFunctionFromMap(
  areaTypeLabelTranslations,
  "Area Type Label",
  "en"
);

export function searchAddrsAreEqual(
  addr1: SearchAddressWithoutBbl,
  addr2: SearchAddressWithoutBbl
) {
  return (
    addr1.boro === addr2.boro &&
    addr1.streetname === addr2.streetname &&
    addr1.housenumber === addr2.housenumber
  );
}

// https://www.codevertiser.com/reusable-input-component-react/
export const useInput = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return {
    value,
    error,
    showError,
    setValue,
    setError,
    setShowError,
    onChange: handleChange,
  };
};

const helpers = {
  // filter repeated values in rbas and owners
  // uses Set which enforces uniqueness
  // see: https://stackoverflow.com/a/44601543/991673
  uniq<T>(_array: T[]): T[] {
    return Array.from(new Set(_array.map((val) => JSON.stringify(val)))).map((val) =>
      JSON.parse(val)
    );
  },

  find<T, K extends keyof T>(array: T[], attrib: K, value: T[K]): T | null {
    for (let i = 0; i < array.length; i++) {
      if (array[i][attrib] === value) return array[i];
    }
    return null;
  },

  maxArray(array: number[]): number {
    var max = 0;
    for (let i = 0; i < array.length; i++) {
      if (max < array[i]) {
        max = array[i];
      }
    }
    return max;
  },

  /**
   * Same functionality as the built-in Array.prototype.flat() function,
   * but with greater support across older browsers.
   */
  flattenArray(array: any[]): any[] {
    return array.reduce((arr, elem) => arr.concat(elem), []);
  },

  getMostCommonElementsInArray(array: string[], numberOfResults: number): string[] {
    const elementsByFrequency = _.countBy(array);
    const sortedElementsByFrequency = Object.entries(elementsByFrequency).sort(
      (a, b) => b[1] - a[1]
    );
    // Let's discard the frequency number and just return a simple array of strings, in order:
    return sortedElementsByFrequency.slice(0, numberOfResults).map((a) => a[0]);
  },

  /**
   * Note: while almost all address records will just have one landlord listed, there is a rare
   * edge case where more than one distinct landlord name might be listed, so we return an array
   * of names here to accommodate that edge case.
   */
  getLandlordNameFromAddress(addr: AddressRecord): string[] {
    const { ownernames } = addr;
    if (!ownernames) return [];
    const landlords = ownernames.filter((owner) =>
      ["HeadOfficer", "IndividualOwner", "CorporateOwner", "JointOwner"].includes(owner.title)
    );
    const landlordNames = landlords.map((landlord) => landlord.value);
    // Remove duplicate names:
    return Array.from(new Set(landlordNames));
  },

  splitBBL(bbl: string) {
    const bblArr = bbl.split("");
    const boro = bblArr.slice(0, 1).join("");
    const block = bblArr.slice(1, 6).join("");
    const lot = bblArr.slice(6, 10).join("");
    return { boro, block, lot };
  },

  addrsAreEqual<T extends { bbl: string }>(a: T, b: T) {
    return a.bbl === b.bbl;
  },

  formatPrice(amount: number, locale?: SupportedLocale): string {
    const formatPrice = new Intl.NumberFormat(locale || defaultLocale);
    return formatPrice.format(amount);
  },

  createTakeActionURL(
    addr: { boro?: string; housenumber: string; streetname: string } | null | undefined,
    utm_medium: string
  ) {
    const subdomain = process.env.REACT_APP_DEMO_SITE === "1" ? "demo" : "app";
    if (addr && addr.boro && (addr.housenumber || addr.streetname)) {
      const formattedBoro = addr.boro.toUpperCase().replace(/ /g, "_");
      if (["BROOKLYN", "QUEENS", "BRONX", "MANHATTAN", "STATEN_ISLAND"].includes(formattedBoro)) {
        const fullAddress = (
          addr.housenumber +
          (addr.housenumber && addr.streetname && " ") +
          addr.streetname
        ).trim();
        return `https://${subdomain}.justfix.org/ddo?address=${encodeURIComponent(
          fullAddress
        )}&borough=${encodeURIComponent(
          formattedBoro
        )}&utm_source=whoownswhat&utm_content=take_action&utm_medium=${utm_medium}`;
      }
    } else {
      reportError(`Address improperly formatted for DDO: ${addr || "<falsy value>"}`);
      return `https://${subdomain}.justfix.org/?utm_source=whoownswhat&utm_content=take_action_failed_attempt&utm_medium=${utm_medium}`;
    }
  },

  capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  titleCase(string: string): string {
    return string
      .toLowerCase()
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  },

  formatDate(dateString: string, options: object, locale?: SupportedLocale): string {
    var date = new Date(dateString);
    return this.capitalize(date.toLocaleDateString(locale || defaultLocale, options));
  },

  /** The quarter number written out as it's range of months (ex: "1" becomes "Jan - Mar")  */
  getMonthRangeFromQuarter(quarter: "1" | "2" | "3" | "4", locale?: SupportedLocale): string {
    const monthRange = {
      start: (parseInt(quarter) * 3 - 2).toString().padStart(2, "0"), // i.e "01"
      end: (parseInt(quarter) * 3).toString().padStart(2, "0"), // i.e. "03"
    };

    // Note: the year and day of each of these dates is meaningless, as we only need to extract the month
    const startDate = `2000-${monthRange.start}-15`;
    const endDate = `2000-${monthRange.end}-15`;

    return `${this.formatDate(startDate, { month: "short" }, locale).slice(
      0,
      3
    )} - ${this.formatDate(endDate, { month: "short" }, locale).slice(0, 3)}`;
  },

  formatHpdContactAddress(
    address: HpdContactAddress
  ): { addressLine1: string; addressLine2: string } {
    const { housenumber, streetname, apartment, city, state, zip } = address;
    const cityFormatted = city && state ? `${city},` : city;

    const formatArrayAsString = (addrs: (string | null)[]) =>
      addrs
        .filter((x) => !!x)
        .join(" ")
        .toUpperCase();

    return {
      addressLine1: formatArrayAsString([housenumber, streetname, apartment]),
      addressLine2: formatArrayAsString([cityFormatted, state, zip]),
    };
  },

  translateComplaintType,
  translateContactTitle,

  /**
   * Translates a HPD Contact title into a target language, and if the target language
   * isn't English, includes the English translation as well alongside it.
   *
   * For example, this function takes the title `HeadOfficer`, and spits out:
   * - 'Head Officer' if the target language is English
   * - 'Oficial principal ("Head Officer" en inglés)"' if the target language is Spanish
   */
  translateContactTitleAndIncludeEnglish(textToTranslate: string, i18n: I18n) {
    const translation = translateContactTitle(textToTranslate, i18n);
    if (i18n.language === "en") return translation;
    else {
      const textInEnglish = getContactTitleInEnglish(textToTranslate, i18n);
      const translationSuffix = i18n._(t`("${textInEnglish}" in English)`);
      return translation + " " + translationSuffix;
    }
  },

  /**
   * Detects whether a given DOM element is visible on screen.
   *
   * Note: for older browsers that do not support IntersectionObserver, this
   * hook will always return FALSE by default.
   *
   * Borrowed from https://stackoverflow.com/questions/45514676/react-check-if-element-is-visible-in-dom
   */
  useOnScreen(ref: React.RefObject<any>) {
    const isIntersectionObserverSupported = typeof IntersectionObserver !== "undefined";

    const [isIntersecting, setIntersecting] = useState(false);
    const observer =
      isIntersectionObserverSupported &&
      new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));

    useEffect(() => {
      if (observer && ref.current) {
        observer.observe(ref.current);
        // Remove the observer as soon as the component is unmounted
        return () => {
          observer.disconnect();
        };
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return isIntersecting;
  },

  /**
   * Detects whether a user's viewport window has changed dimensions.
   *
   * Adapted from https://usehooks.com/useWindowSize/
   */
  useWindowSize() {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState<{
      width: number | undefined;
      height: number | undefined;
    }>({
      width: undefined,
      height: undefined,
    });

    // How long we should wait before handling a window resize
    const DEBOUNCE_TIME_IN_MS = 250;
    useEffect(() => {
      // Handler to call on window resize
      function handleResize() {
        // Set window width/height to state
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
      // Add event listener
      window.addEventListener("resize", debounce(DEBOUNCE_TIME_IN_MS, handleResize));
      // Call handler right away so state gets updated with initial window size
      handleResize();
      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
  },

  regexEscape(str: string) {
    return str?.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  },

  scrollToBottom(selectors: string) {
    const elem = document.querySelector(selectors);
    elem?.scroll(0, elem?.scrollHeight);
  },

  /**
   * Prevents user from typing non-numeric characters in an input field. Necessary
   * because Firefox doesn't do this by default with type="numeric" inputs.
   * See https://stackoverflow.com/a/49924215/7051239
   */
  preventNonNumericalInput(e: React.KeyboardEvent) {
    e = e || window.event;
    // Control keys (tab, delete, arrows, etc.) are length > 1
    if (!/^\d$/.test(e.key) && e.key.length === 1) e.preventDefault();
  },

  /**
   * Format and translate Area Alerts district labels for display on settings or
   * selection chips
   */
  formatTranslatedAreaLabel(area: AreaProperties, i18n: I18n, chip: boolean): string {
    const { typeValue, areaLabel } = area;
    const noPrefixTypes = chip ? ["nta", "zipcode", "borough"] : ["nta", "borough"];
    const formattedLabel = noPrefixTypes.includes(typeValue)
      ? areaLabel
      : `${translateAreaTypeLabel(typeValue, i18n)} ${areaLabel.replace(/district\s*/i, "")}`;

    return formattedLabel;
  },
};

export default helpers;
