/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import DebounceSelect from "@/components/common/DebounceSelect";
import {studentService} from "@/services/student.service";

export default function StudentSelect({
  value,
  onChange,
  placeholder = "Cari Siswa (Ketik Nama/NIS)",
  style,
  mode,
  disabled,
  ...rest
}: any) {
  const fetchStudentList = async (searchText: string) => {
    try {
      const res = await studentService.getStudents({
        search: searchText,
        limit: 20,
        page: 1,
        status: "active", // Only show active students
      });
      return res.data.map((s) => ({
        label: `${s.name} (${s.nis})`,
        value: s.nis, // Use NIS as value
      }));
    } catch (error) {
      console.error("Failed to fetch students", error);
      return [];
    }
  };

  // Transform raw value (NIS string) into object format expected by DebounceSelect (labelInValue)
  // If we only have the NIS string, we set label = NIS temporarily until searched.
  const internalValue = React.useMemo(() => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.map((v: string) => ({
        label: v, // Fallback label is NIS if we don't have name
        value: v,
      }));
    }
    // Single value
    if (typeof value === "object" && "value" in value) return value; // Already object (rare)
    return {
      label: value,
      value: value,
    };
  }, [value]);

  return (
    <DebounceSelect
      showSearch
      mode={mode}
      value={internalValue}
      placeholder={placeholder}
      fetchOptions={fetchStudentList}
      onChange={(newValue: any) => {
        // DebounceSelect returns {label, value} objects or array of them
        // We need to extract the values (NIS) to pass to parent
        if (mode === "multiple") {
          onChange?.(newValue.map((v: any) => v.value));
        } else {
          onChange?.(newValue?.value);
        }
      }}
      style={style}
      disabled={disabled}
      debounceTimeout={800} // 800ms delay to prevent lag
      {...rest}
    />
  );
}
