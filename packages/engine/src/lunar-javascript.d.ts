declare module 'lunar-javascript' {
  interface EightChar {
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearNaYin(): string;
    getYearHideGan(): string;
    getYearShiShenGan(): string;

    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthNaYin(): string;
    getMonthHideGan(): string;
    getMonthShiShenGan(): string;

    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayNaYin(): string;
    getDayHideGan(): string;

    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeNaYin(): string;
    getTimeHideGan(): string;
    getTimeShiShenGan(): string;

    getYun(gender: number, sect?: number): Yun;
  }

  interface Yun {
    getStartYear(): number;
    getStartAge(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getDaYun(): DaYunItem[];
  }

  interface DaYunItem {
    getStartAge(): number;
    getStartYear(): number;
    getEndAge(): number;
    getEndYear(): number;
    getGanZhi(): string;
    getLiuNian(): LiuNianItem[];
  }

  interface LiuNianItem {
    getYear(): number;
    getAge(): number;
    getGanZhi(): string;
  }

  interface Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getEightChar(): EightChar;
    getDayGan(): string;
    getDayZhi(): string;
    getDayInGanZhi(): string;
    next(n: number): Lunar;
  }

  interface SolarStatic {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    fromYmd(year: number, month: number, day: number): Solar;
  }

  interface Solar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getLunar(): Lunar;
    next(n: number): Solar;
  }

  export const Solar: SolarStatic;
  export const Lunar: {
    fromYmd(year: number, month: number, day: number): Lunar;
  };
}
