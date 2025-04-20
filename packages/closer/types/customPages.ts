export type Page = {
    isHomePage: boolean;
    sections: {
      type: string;
      data: Record<string, any>;
    }[];
  };
  