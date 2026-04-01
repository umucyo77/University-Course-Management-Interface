import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AuthContext } from "../context/authContext";

const API_BASE_URL =
  "https://student-management-system-backend.up.railway.app/api/courses";

const emptyForm = {
  courseName: "",
  description: "",
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const normalizeCourse = (course) => ({
  id: course?.id ?? course?._id ?? course?.courseId ?? "",
  courseName: course?.courseName ?? course?.name ?? course?.title ?? "",
  description: course?.description ?? course?.courseDescription ?? "",
});

const extractCourses = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data.map(normalizeCourse);
  if (Array.isArray(data?.courses)) return data.courses.map(normalizeCourse);
  if (Array.isArray(data?.data)) return data.data.map(normalizeCourse);

  return [];
};

const extractCourse = (payload) => {
  const data = payload?.data ?? payload;
  const course = data?.course ?? data?.data ?? data;
  return normalizeCourse(course);
};

const CreateCourse = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useContext(AuthContext);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      return extractCourses(response.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (courseData) =>
      axios.post(API_BASE_URL, courseData, {
        headers: getAuthHeaders(),
      }),
    onSuccess: async () => {
      setSuccessMessage("Course created successfully.");
      setErrorMessage("");
      setFormData(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to create course. Please try again.";
      setErrorMessage(message);
      setSuccessMessage("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, courseData }) =>
      axios.put(`${API_BASE_URL}/${id}`, courseData, {
        headers: getAuthHeaders(),
      }),
    onSuccess: async (response) => {
      setSuccessMessage("Course updated successfully.");
      setErrorMessage("");
      setEditingCourseId(null);
      setFormData(emptyForm);
      setSelectedCourse(extractCourse(response.data));
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update the course.";
      setErrorMessage(message);
      setSuccessMessage("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      axios.delete(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
      }),
    onSuccess: async (_, deletedId) => {
      setSuccessMessage("Course deleted successfully.");
      setErrorMessage("");
      setSelectedCourse((current) => (current?.id === deletedId ? null : current));
      if (editingCourseId === deletedId) {
        setEditingCourseId(null);
        setFormData(emptyForm);
      }
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to delete the course.";
      setErrorMessage(message);
      setSuccessMessage("");
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      courseName: formData.courseName.trim(),
      description: formData.description.trim(),
    };

    if (editingCourseId) {
      updateMutation.mutate({
        id: editingCourseId,
        courseData: payload,
      });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleEdit = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      courseName: course.courseName,
      description: course.description,
    });
    setSelectedCourse(course);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleDelete = (id) => {
    if (!id) {
      setErrorMessage("This course does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    setSuccessMessage("");
    setErrorMessage("");
    deleteMutation.mutate(id);
  };

  const cancelEdit = () => {
    setEditingCourseId(null);
    setFormData(emptyForm);
  };

  const courses = coursesQuery.data ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_35%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
                Supervisor Dashboard
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                University Course Management
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Create, review, search, update, and delete courses from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        {(errorMessage || successMessage) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <form
              className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
              onSubmit={handleSubmit}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingCourseId ? "Update Course" : "Create Course"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a new course or update an existing one using the same form.
                  </p>
                </div>

                {editingCourseId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Course Name
                  </span>
                  <input
                    type="text"
                    name="courseName"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="e.g. React Basics"
                    value={formData.courseName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Enter course description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <button
                className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? editingCourseId
                    ? "Saving changes..."
                    : "Creating..."
                  : editingCourseId
                  ? "Save Changes"
                  : "Create Course"}
              </button>
            </form>

            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Course Catalog
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse all courses and choose one to inspect, edit, or delete.
                </p>
              </div>

              {coursesQuery.isLoading && (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Loading courses...
                </p>
              )}

              {coursesQuery.isError && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
                  Unable to load courses. Please refresh or log in again.
                </p>
              )}

              {!coursesQuery.isLoading && !courses.length && !coursesQuery.isError && (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No courses available yet. Create the first course from the form above.
                </p>
              )}

              <div className="space-y-4">
                {courses.map((course) => (
                  <article
                    key={course.id || `${course.courseName}-${course.description}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {course.courseName || "Untitled Course"}
                          </h3>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                            ID: {course.id || "N/A"}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                          {course.description || "No description available."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(course)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(course)}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Course Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Detailed information for the selected course appears here.
                </p>
              </div>

              {!selectedCourse && (
                <p className="rounded-2xl bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Select a course from the catalog to view details.
                </p>
              )}

              {selectedCourse && (
                <div className="space-y-4 rounded-3xl bg-slate-50/90 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Course ID
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-900">
                      {selectedCourse.id || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Course Name
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-900">
                      {selectedCourse.courseName || "Untitled Course"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedCourse.description || "No description available."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(selectedCourse)}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      Edit This Course
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedCourse.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                      disabled={deleteMutation.isPending}
                    >
                      Delete This Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateCourse;
