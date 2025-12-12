export interface RegisterSchoolInput {
  school_name: string;
  phone: string;
  address: string;
}

export interface SchoolResponse {
  id: string;
  name: string;
  code: string;
  address: string;
  logo_url?: string;
}
