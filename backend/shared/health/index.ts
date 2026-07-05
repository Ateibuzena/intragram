export interface HealthResponse {
	service: string;
	status: 'ok';
	timestamp: string;
	uptime: number;
}

declare const process: {
	uptime(): number;
};

export const createHealthResponse = (service: string): HealthResponse => ({
	service,
	status: 'ok',
	timestamp: new Date().toISOString(),
	uptime: Math.floor(process.uptime()),
});