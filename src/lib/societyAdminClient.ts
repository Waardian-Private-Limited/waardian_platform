import { apiClient, ApiResponse } from './apiClient';

export interface SocietyMember {
  id: number;
  user_id?: number; 
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  flat_number?: string;
  phoneNumber: string;
  userType: string;
  memberType?: string;
  status?: string;
  createdAt?: string;
  wingId: string;
  floorId: string;
  flatId: string;
  IAM?: string;
  wing_id?: string | number; // Added to support mapping in modal
  floor_id?: string | number; // Added to support mapping in modal
  flat_id?: string | number; // Added to support mapping in modal
  wing_name?: string; // Added to support mapping in modal
}

export interface Flat {
  flat_id: string | number;
  wing_id?: string | number;
  floor_id?: string | number;
  flat_number: string;
  square_feet?: number | string;
  occupancy_status?: string;
  flat_type?: string;
  max_tenants?: number;
  is_rent_management_enabled?: number | boolean;
  preferred_payment_mode?: string;
  created_at?: string;
  floor?: Floor;
  members?: SocietyMember[];
}

export interface FlatWithLocation {
  flat_id: string;
  flat_number: string;
  wing_id: string;
  floor_id: string;
  wing_name: string;
  floor_number: number;
}

export interface Floor {
  floor_id: string;
  floor_number: number;
  wing: Wing;
  flats?: Flat[];
}

export interface Wing {
  id: string;
  name: string;
  societyId: number;
  createdAt: string;
  floors?: Floor[];
}


interface RawWing {
  wing_id: number;
  wing_name: string;
  society_id: number;
  created_at: string;
}

interface RawFloor {
  floor_id: number;
  wing_id: number;
  floor_number: number;
  created_at: string;
}

export const getSocietyMembers = async (params: {
  page?: number;
  size?: number;
  search?: string;
  wing?: string;
  floor?: string;
  flat?: string;
  status?: string;
  sortField?: string;
  sortOrder?: string;
  filter?: string;
}): Promise<ApiResponse<{ data: SocietyMember[]; total: number }>> => {
  const response = await apiClient('/society-admin/members', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: {
      page: (params.page || 0).toString(),
      size: (params.size || 5).toString(),
      search: params.search || '',
      wing: params.wing || '',
      floor: params.floor || '',
      flat: params.flat || '',
      status: params.status || '',
      sortField: params.sortField || '',
      sortOrder: params.sortOrder || '',
      filter: params.filter || 'primary',
    },
  });

  if (response.success && response.data) {
    // Backend might return the array directly in 'data' OR nested in 'data.data'
    const rawData = Array.isArray(response.data) 
      ? response.data 
      : (response.data as any).data || [];

    const members = (rawData as any[]).map((member: any): SocietyMember => ({
      id: member.id || member.user_id, // Ensure we have a numeric ID for internal use
      user_id: member.user_id,
      name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      email: member.email || '',
      flat_number: member.flat_number,
      phoneNumber: member.phone_number,
      userType: member.userType || 'member',
      memberType: member.member_type,
      status: member.status,
      createdAt: member.created_at,
      wingId: member.wing_id,
      floorId: member.floor_id,
      flatId: member.flat_id,
      wing_name: member.wing_name,
      IAM: member.IAM || 'owner',
    }));

    return {
      ...response,
      data: {
        data: members,
        total: response.total || (response.data as any).total || members.length
      }
    };
  }

  return response;
};

export const addSocietyMember = async (member: Omit<SocietyMember, 'id' | 'createdAt'>): Promise<ApiResponse<SocietyMember>> => {
  const response = await apiClient('/society-admin/members/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: (member),
  });
  // console.log('addSocietyMember response:', response);
  return response;
};

export const updateSocietyMember = async (id: number, member: Omit<SocietyMember, 'id' | 'createdAt'>): Promise<ApiResponse<SocietyMember>> => {
  const response = await apiClient(`/society-admin/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: (member),
  });
  // console.log('updateSocietyMember response:', response);
  return response;
};

export const updateMemberStatus = async (id: number, status: string): Promise<ApiResponse<SocietyMember>> => {
  const response = await apiClient(`/api/societyadmin/members/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: { status },
  });
  // console.log('updateMemberStatus response:', response);
  return response;
};

export const deleteSocietyMember = async (id: number): Promise<ApiResponse<SocietyMember>> => {
  const response = await apiClient(`/api/societyadmin/members/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  // console.log('deleteSocietyMember response:', response);
  return response;
};

export async function getWings(): Promise<ApiResponse<Wing[]>> {
  const response: ApiResponse<RawWing[]> = await apiClient('/society-admin/members/wings', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (response.success && response.data) {
    return {
      ...response,
      data: response.data.map((raw: RawWing) => ({
        id: raw.wing_id.toString(),
        name: raw.wing_name,
        societyId: raw.society_id,
        createdAt: raw.created_at,
        floors: [],
      }))
    };
  }
  return { ...response, data: [] };
}

export async function getFloors(wingId: string): Promise<ApiResponse<Floor[]>> {
  const response: ApiResponse<Floor[]> = await apiClient('/society-admin/members/floors', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { wingId },
  });
  return response;
}

export async function getFlats(wingId: string, floorId: string): Promise<ApiResponse<Flat[]>> {
  const response: ApiResponse<Flat[]> = await apiClient('/society-admin/members/flats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { wingId, floorId },
  });
  return response;
}

export async function getAllFlats(): Promise<FlatWithLocation[]> {
  const response: ApiResponse<FlatWithLocation[]> = await apiClient('/billing/all-flats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch all flats');
  }
  return response.data ?? []; 
}

export async function getSpecificMembers(wingId: string, floorId: string, flatId: string): Promise<SocietyMember[]> {
  const response: ApiResponse<any[]> = await apiClient('/society-admin/members/getSpecificMembers', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { wingId, floorId, flatId },
  });
  // console.log('getMembers response:', response);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch members');
  }
  const members = (response.data ?? []).map((member): SocietyMember => ({
    id: member.id,
    user_id: member.user_id, // Added user_id mapping
    name: `${member.first_name} ${member.last_name}`,
    email: member.email,
    firstName:member.first_name,
    lastName:member.last_name,
    flat_number: member.flat_number,
    phoneNumber: member.phone_number,
    userType: member.member_type || 'member',
    status: member.status,
    createdAt: member.created_at,
    wingId: member.wing_id,
    floorId: member.floor_id,
    flatId: member.flat_id,
    IAM: member.IAM || 'owner', // Added IAM mapping
  }));
  return members;
}
export const importMembers = async (file: File): Promise<ApiResponse<void>> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient('/society-admin/members/import', {
    method: 'POST',
    body: formData,
  });
  
  return response;
};


export interface MembersDashboardStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  trends?: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    pendingApprovals: number;
  };
}

export async function getMembersDashboardStats(societyId: string | number): Promise<ApiResponse<MembersDashboardStats>> {
  const response = await apiClient('/society-admin/members/dashboard-stats', {
    method: 'GET',
    withAuth: true,
    params: { societyId: societyId.toString() },
  });
  return response;
}

// New: Promote a member to Society Admin
export async function makeMemberSocietyAdmin(userId: number): Promise<ApiResponse<any>> {
  const response = await apiClient(`/society-admin/members/${userId}/make-admin`, {
    method: 'POST',
    withAuth: true,
  });
  return response;
}

export interface WingCreatePayload {
  name: string;
  floors: number;
  flatTypes: Array<{ type: string; count: number; squareFootage: number }>;
  accountsPerFlat?: number;
}

export interface FloorCreatePayload {
  floorNumber: number;
  flatTypes: Array<{ type: string; count: number; squareFootage: number }>;
  accountsPerFlat?: number;
}

export interface FlatCreatePayload {
  flatNumber: string;
  squareFeet: number;
  flatType: string;
  occupancyStatus?: string;
  maxTenants?: number;
  preferredPaymentMode?: string;
}

export interface FlatUpdatePayload {
  square_feet?: number;
  occupancy_status?: string;
  flat_type?: string;
}

export async function renameWing(wingId: string, wing_name: string): Promise<ApiResponse<any>> {
  const response: ApiResponse<any> = await apiClient(`/society-admin/wings/${wingId}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: { wing_name },
  });
  return response;
}

export async function updateFlatDetails(flatId: string, payload: FlatUpdatePayload): Promise<ApiResponse<any>> {
  const response: ApiResponse<any> = await apiClient(`/society-admin/flats/${flatId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  return response;
}

export async function createWing(payload: WingCreatePayload): Promise<ApiResponse<any>> {
  const response: ApiResponse<any> = await apiClient('/society-admin/wings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  return response;
}

export async function createFloor(wingId: string, payload: FloorCreatePayload): Promise<ApiResponse<any>> {
  const response: ApiResponse<any> = await apiClient(`/society-admin/wings/${wingId}/floors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  return response;
}

export async function createFlat(wingId: string, floorId: string, payload: FlatCreatePayload): Promise<ApiResponse<any>> {
  const response: ApiResponse<any> = await apiClient(`/society-admin/wings/${wingId}/floors/${floorId}/flats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  return response;
}