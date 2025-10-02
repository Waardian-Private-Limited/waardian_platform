import { apiClient } from './apiClient';

export interface SocietyMember {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  flat_number: string;
  phoneNumber: string;
  userType: string;
  status: string;
  createdAt: string;
  wingId: string;
  floorId: string;
  flatId: string;
}

export interface Flat {
  flat_id: string;
  flat_number: string;
  floor: Floor;
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
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
  // console.log('getSocietyMembers response:', response);
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

export async function getWings(): Promise<Wing[]> {
  const response: ApiResponse<RawWing[]> = await apiClient('/society-admin/members/wings', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  // console.log('getWings response:', response);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch wings');
  }
  return (response.data ?? []).map((raw: RawWing) => ({
    id: raw.wing_id.toString(),
    name: raw.wing_name,
    societyId: raw.society_id,
    createdAt: raw.created_at,
    floors: [],
  }));
}

export async function getFloors(wingId: string): Promise<Floor[]> {
  const response: ApiResponse<Floor[]> = await apiClient('/society-admin/members/floors', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { wingId },
  });
  // console.log('getFloors response:', response);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch floors');
  }
  return response.data ?? [];
}

export async function getFlats(wingId: string, floorId: string): Promise<Flat[]> {
  const response: ApiResponse<Flat[]> = await apiClient('/society-admin/members/flats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { wingId, floorId },
  });
  // console.log('getFlats response:', response);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch flats');
  }
  return response.data ?? [];
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