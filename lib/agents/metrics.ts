/** Metrics extracted in Node 1 — retrieval tuned for SEC 10-K / annual reports */
export const METRIC_DEFINITIONS = [
  {
    label: "Revenue and YoY growth",
    query:
      "total revenue net sales annual revenue year over year YoY growth percentage",
    supplementalQueries: [
      "consolidated statements of income revenue year ended December 31 2023 2022 in millions",
      "revenue year ended March 31 crore INR rupees consolidated total",
      "MD&A revenue increased decreased percent compared prior year",
    ],
  },
  {
    label: "Net Income / EPS",
    query: "net income earnings per share EPS diluted earnings consolidated statements",
    supplementalQueries: [
      "net income year ended December 31 2023 2022 in millions except per share",
      "profit after tax net profit year ended March 31 INR crore million consolidated",
      "earnings per share basic diluted Class A Class B",
    ],
  },
  {
    label: "Operating Margin",
    query:
      "operating income income from operations operating margin percent profitability",
    supplementalQueries: [
      "consolidated statements of income operating income revenue costs and expenses percent",
      "income from operations as percent of revenue",
    ],
  },
  {
    label: "Free Cash Flow",
    query: "free cash flow FCF cash from operations capital expenditures",
    supplementalQueries: [
      "net cash provided by operating activities purchases of property equipment free cash flow reconciliation",
      "cash flows statement investing activities capital expenditures",
    ],
  },
  {
    label: "Debt/Equity Ratio",
    query:
      "total debt long-term debt stockholders equity total liabilities balance sheet",
    supplementalQueries: [
      "consolidated balance sheets total assets total liabilities equity December 31",
      "debt to equity ratio leverage total debt shareholders equity",
    ],
  },
  {
    label: "Forward Guidance",
    query:
      "forward guidance outlook forecast next quarter full year guidance expectations outlook",
    supplementalQueries: [
      "expect revenue expenses capital expenditures anticipate future period guidance",
    ],
  },
] as const;
