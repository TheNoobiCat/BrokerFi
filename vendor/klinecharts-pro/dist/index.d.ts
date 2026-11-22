import { Chart, DeepPartial, FigureCreate, IndicatorCreate, KLineData, LineType, Nullable, Overlay, OverlayCreate, OverlayEvent, PaneOptions, Period as DefaultPeriod, Styles } from 'klinecharts';

export type OrderOverlayAttributes = {
	setPrice: (price: number) => OrderOverlay;
	setText: (text: string) => OrderOverlay;
	setQuantity: (quantity: string) => OrderOverlay;
	setModifyTooltip: (tooltip: string) => OrderOverlay;
	setTooltip: (tooltip: string) => OrderOverlay;
	setLineColor: (color: string) => OrderOverlay;
	setLineWidth: (width: number) => OrderOverlay;
	setLineStyle: (style: LineType) => OrderOverlay;
	setLineLength: (length: number) => OrderOverlay;
	setLineDashedValue: (dashedValue: number[]) => OrderOverlay;
	setBodyFont: (font: string) => OrderOverlay;
	setBodyFontWeight: (weight: FontWeights | number) => OrderOverlay;
	setBodyTextColor: (color: string) => OrderOverlay;
	setBodyBackgroundColor: (color: string) => OrderOverlay;
	setBodyBorderColor: (color: string) => OrderOverlay;
	setQuantityFont: (font: string) => OrderOverlay;
	setQuantityFontWeight: (weight: FontWeights | number) => OrderOverlay;
	setQuantityColor: (color: string) => OrderOverlay;
	setQuantityBackgroundColor: (color: string) => OrderOverlay;
	setQuantityBorderColor: (color: string) => OrderOverlay;
	setCancelButtonIconColor: (color: string) => OrderOverlay;
	setCancelButtonFontWeight: (weight: FontWeights | number) => OrderOverlay;
	setCancelButtonBackgroundColor: (color: string) => OrderOverlay;
	setCancelButtonBorderColor: (color: string) => OrderOverlay;
	setBorderStyle: (style: LineType) => OrderOverlay;
	setBorderSize: (size: number) => OrderOverlay;
	setBorderDashedValue: (dashedValue: number[]) => OrderOverlay;
	setBorderRadius: (radius: number) => OrderOverlay;
	onMoveStart: <T>(params: T, callback: (params: T, event?: OverlayEvent<unknown>) => void) => OrderOverlay;
	onMove: <T>(params: T, callback: (params: T, event?: OverlayEvent<unknown>) => void) => OrderOverlay;
	onMoveEnd: <T>(params: T, callback: (params: T, event?: OverlayEvent<unknown>) => void) => OrderOverlay;
	onCancel: <T>(params: T, callback: (params: T, event?: OverlayEvent<unknown>) => void) => OrderOverlay;
	onModify: <T>(params: T, callback: (params: T, event?: OverlayEvent<unknown>) => void) => OrderOverlay;
};
export type OrderOverlay = Pick<Overlay, "id" | "paneId" | "name" | "groupId" | "mode" | "points"> & OrderOverlayAttributes;
export interface PaneProperties extends Styles {
	backgroundType: "solid" | "gradient";
	background: string;
	backgroundGradientStartColor: string;
	backgroundGradientEndColor: string;
}
export type FontWeights = "thin" | "extra-light" | "light" | "normal" | "medium" | "semi-bold" | "bold" | "extra-bold" | "black";
export type OrderType = "buy" | "sell" | "buystop" | "buylimit" | "sellstop" | "selllimit";
export type OrderModalType = "placeorder" | "modifyorder" | "closepartial";
export type ExitType = "stoploss" | "takeprofit" | "breakeven" | "manualclose" | "cancel";
export type DatafeedSubscribeCallback = (data: KLineData, timestamp?: number) => void;
export type OrderPlacedCallback = (data: OrderInfo | null) => void;
export interface UndoOptions {
	/**
	 * A boolean flag. Controls if undo should be disabled.
	 */
	disableUndo?: boolean;
}
export interface SymbolInfo {
	ticker: string;
	name?: string;
	shortName?: string;
	exchange?: string;
	market?: string;
	pricePrecision?: number;
	volumePrecision?: number;
	priceCurrency?: string;
	dollarPerPip?: number;
	type?: string;
	logo?: string;
}
export interface OrderInfo {
	orderId: number;
	action: OrderType;
	entryPoint: number;
	exitPoint?: number;
	stopLoss?: number;
	takeProfit?: number;
	lotSize: number;
	pips?: number;
	pl?: number;
	entryTime?: string;
	exitTime?: string;
	exitType?: ExitType;
	partials?: string;
	accountId?: number;
}
export interface OrderModifyInfo {
	id: number;
	action?: OrderType;
	entrypoint?: number;
	exitpoint?: number;
	stoploss?: number;
	takeprofit?: number;
	lotsize?: number;
	pips?: number;
	pl?: number;
	exittime?: string;
	exittype?: ExitType;
	partials?: string;
}
export interface Period extends DefaultPeriod {
	text: string;
}
export interface ProChart extends Chart {
	chart: Chart;
	charts: Array<Chart>;
	setActiveChart(id: string): void;
	chartById(id: string): Chart | undefined;
	getOverlayById(id: string): Nullable<Overlay>;
	createOrderLine(options?: UndoOptions): Nullable<OrderOverlay>;
	createOrderLines(nums: number, options?: UndoOptions): Array<Nullable<OrderOverlay>>;
}
export type IndicatorsType = {
	value?: IndicatorCreate;
	isStack?: boolean;
	paneOptions?: PaneOptions;
};
export type OverlaysType = {
	value?: OverlayCreate;
	paneId: string;
};
export type FiguresType = {
	value?: string | FigureCreate;
	ctx: CanvasRenderingContext2D;
};
export type OrderStyleType = {
	lineStyle?: {
		style?: string;
		size?: number;
		color?: string;
		dashedValue?: number[];
	};
	labelStyle?: {
		style?: string;
		size?: number;
		family?: string;
		weight?: string;
		paddingLeft?: number;
		paddingRight?: number;
		paddingBottom?: number;
		paddingTop?: number;
		borderStyle?: string;
		borderSize?: number;
		color?: string;
		borderColor?: string;
		backgroundColor?: string;
	};
};
export type OrderStylesType = {
	buyStyle?: OrderStyleType;
	buyLimitStyle?: OrderStyleType;
	buyStopStyle?: OrderStyleType;
	sellStyle?: OrderStyleType;
	sellLimitStyle?: OrderStyleType;
	sellStopStyle?: OrderStyleType;
	stopLossStyle?: OrderStyleType;
	takeProfitStyle?: OrderStyleType;
};
export interface ChartObjType {
	styleObj?: DeepPartial<PaneProperties>;
	overlays?: OverlaysType[];
	figures?: FiguresType[];
	indicators?: IndicatorsType[];
	orderStyles?: OrderStylesType;
}
export interface Datafeed {
	searchSymbols(search?: string): Promise<SymbolInfo[]>;
	getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]>;
	subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void;
	unsubscribe(symbol: SymbolInfo, period: Period): void;
}
export interface OrderResource {
	retrieveOrder(order_id: number): Promise<OrderInfo | null>;
	retrieveOrders(action?: OrderType, account_id?: number | string): Promise<OrderInfo[] | null>;
	openOrder(action: OrderType, lot_size: number, entry_price: number, stop_loss?: number, take_profit?: number): Promise<OrderInfo | null>;
	closeOrder(order_id: number, lotsize?: number): Promise<OrderInfo | null>;
	modifyOrder(order: OrderModifyInfo): Promise<OrderInfo | null>;
	unsetSlOrTP(order_id: string | number, slortp: "sl" | "tp"): Promise<OrderInfo | null>;
	launchOrderModal(type: OrderModalType, callback: OrderPlacedCallback, order?: OrderModifyInfo): void;
}
export interface ChartProOptions {
	container: string | HTMLElement;
	rootElementId?: string;
	watermark?: string | Node;
	theme?: string;
	locale?: string;
	drawingBarVisible?: boolean;
	orderPanelVisible?: boolean;
	symbol: SymbolInfo;
	period: Period;
	periods?: Period[];
	timezone?: string;
	mainIndicators?: string[];
	subIndicators?: string[];
	datafeed: Datafeed;
	dataTimestamp?: number;
	orderController?: OrderResource;
	overrides?: DeepPartial<PaneProperties>;
}
export interface ChartPro {
	setTheme(theme: string): void;
	getTheme(): string;
	setStyles(styles: DeepPartial<PaneProperties>): void;
	getStyles(): DeepPartial<PaneProperties>;
	setLocale(locale: string): void;
	getLocale(): string;
	setTimezone(timezone: string): void;
	getTimezone(): string;
	setSymbol(symbol: SymbolInfo): void;
	getSymbol(): SymbolInfo;
	setPeriod(period: Period): void;
	getPeriod(): Period;
	getInstanceApi(): Nullable<Chart>;
	resize(): void;
	dispose(): void;
}
export declare class DefaultDatafeed implements Datafeed {
	constructor(apiKey: string);
	private _apiKey;
	private _prevSymbolMarket?;
	private _ws?;
	searchSymbols(search?: string): Promise<SymbolInfo[]>;
	getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]>;
	subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void;
	unsubscribe(symbol: SymbolInfo, period: Period): void;
}
export declare class DefaultOrderController implements OrderResource {
	constructor(_apiurl: string, _apikey: string, _accound_id: number | string);
	private apikey;
	private apiurl;
	private testsesson_id;
	retrieveOrder(order_id: number): Promise<OrderInfo>;
	retrieveOrders(action?: OrderType, session_id?: number): Promise<OrderInfo[]>;
	openOrder(action: OrderType, lot_size: number, entry_price: number, stop_loss?: number, take_profit?: number): Promise<OrderInfo | null>;
	closeOrder(order_id: number, lotsize?: number): Promise<OrderInfo | null>;
	modifyOrder(order: OrderModifyInfo): Promise<OrderInfo | null>;
	unsetSlOrTP(order_id: string | number, slortp: "sl" | "tp"): Promise<OrderInfo | null>;
	launchOrderModal(type: OrderModalType, callback: OrderPlacedCallback, order?: OrderModifyInfo): void;
	private makeFetchWithAuthAndBody;
}
export declare class DummyOrderController implements OrderResource {
	constructor(storage_name?: string);
	private storage_name;
	retrieveOrder(order_id: number): Promise<Nullable<OrderInfo>>;
	retrieveOrders(action?: OrderType, account_id?: number): Promise<OrderInfo[]>;
	openOrder(action: OrderType, size: number, entry: number, stop_loss?: number, take_profit?: number): Promise<OrderInfo | null>;
	closeOrder(order_id: number, lotsize?: number): Promise<OrderInfo | null>;
	modifyOrder(_order: OrderModifyInfo): Promise<OrderInfo | null>;
	unsetSlOrTP(order_id: string | number, slortp: "sl" | "tp"): Promise<OrderInfo | null>;
	launchOrderModal(type: OrderModalType, callback: OrderPlacedCallback, order?: OrderModifyInfo): void;
	private retrieveOrdersFromLs;
	private retrieveOrderFromLs;
	private storeOrder;
}
export declare class KLineChartPro implements ChartPro {
	constructor(options: ChartProOptions);
	private _container;
	private _chartApi;
	destroy(): void;
	setTheme(theme: string): void;
	getTheme(): string;
	setStyles(styles: DeepPartial<PaneProperties>): void;
	getStyles(): DeepPartial<PaneProperties>;
	setLocale(locale: string): void;
	getLocale(): string;
	setTimezone(timezone: string): void;
	getTimezone(): string;
	setSymbol(symbol: SymbolInfo): void;
	getSymbol(): SymbolInfo;
	setPeriod(period: Period): void;
	getPeriod(): Period;
	getInstanceApi(): Nullable<ProChart>;
	resize(): void;
	dispose(): void;
}
declare function load(key: string, ls: any): void;

export {
	load as loadLocales,
};

export as namespace klinechartspro;

export {};
