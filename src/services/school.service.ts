export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  logo_url: string;
}

export interface UpdateSchoolPayload {
  name: string;
  code: string;
  address: string;
  logo_url?: string;
}

// Mock Data
const MOCK_SCHOOL: School = {
  id: "uuid-school-456",
  name: "SMA Negeri 1 Jakarta",
  code: "SMAN1JKT",
  address: "Jl. Pendidikan No. 1, Jakarta Selatan",
  logo_url: "",
};

export const schoolService = {
  getSchoolDetailsQuery: "GET_SCHOOL_DETAILS",

  getSchoolDetails: async (): Promise<School> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return MOCK_SCHOOL;
  },

  updateSchoolDetails: async (
    payload: UpdateSchoolPayload
  ): Promise<{success: boolean; message: string}> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Updated School Payload:", payload);
    return {
      success: true,
      message: "School identity updated successfully",
    };
  },
};
