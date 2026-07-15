// Service context — kept for backwards compatibility with old callsites.
//
// The fetch shims don't need a clinic id (the backend resolves it from
// req.user.clinicId, which the auth middleware sets from the bearer
// token / dev bypass). This module remains as a stub.

interface ServiceContext {
  userId: string;
  clinicId: string;
}

const DEV_CONTEXT: ServiceContext = {
  userId: '00000000-0000-0000-0000-000000000001',
  clinicId: '00000000-0000-0000-0000-0000000000c1',
};

export const getServiceContext = async (): Promise<ServiceContext> => DEV_CONTEXT;
export const resetServiceContext = (): void => {};
export const __setServiceContextForTest = (
  _ctx: { userId: string; clinicId: string } | null,
): void => {};
