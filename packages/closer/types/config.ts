export type ConfigType = {
  slug: string;
  value: {
    enabled: {
      type: string;
      default: boolean;
    };
    [key: string]: any;
    elements?: {
      type: any[];
      default: any[];
    };
  };
};
