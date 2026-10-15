export const routes = {
  home: "/",
  // same job description, empty resume upload
  newVersion: (fromId: string) => `/?from=${fromId}`,
  // same job description AND same resume (after a failure)
  retry: (fromId: string) => `/?from=${fromId}&keep=resume`,
  result: (id: string) => `/customizations/${id}`,
  history: "/history",
  resumes: "/resumes",
  resume: (id: string) => `/resumes/${id}`,
  // new version using an uploaded resume
  withResume: (resumeId: string) => `/?resume=${resumeId}`,
  login: "/login",
  signup: "/signup",
} as const
