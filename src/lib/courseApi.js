import { apiClient } from "./api";

export const normalizeCourse = (course) => ({
  id: course?.id ?? course?._id ?? course?.courseId ?? "",
  courseName: course?.courseName ?? course?.name ?? course?.title ?? "",
  description: course?.description ?? course?.courseDescription ?? "",
});

export const extractCourses = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data.map(normalizeCourse);
  if (Array.isArray(data?.courses)) return data.courses.map(normalizeCourse);
  if (Array.isArray(data?.data)) return data.data.map(normalizeCourse);

  return [];
};

export const extractCourse = (payload) => {
  const data = payload?.data ?? payload;
  const course = data?.course ?? data?.data ?? data;
  return normalizeCourse(course);
};

export const fetchCourses = async () => {
  const response = await apiClient.get("/courses");
  return extractCourses(response.data);
};

export const createCourse = (courseData) =>
  apiClient.post("/courses", courseData);

export const updateCourse = (id, courseData) =>
  apiClient.put(`/courses/${id}`, courseData);

export const deleteCourse = (id) => apiClient.delete(`/courses/${id}`);
