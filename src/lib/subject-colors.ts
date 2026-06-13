export const getSubjectColors = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        badge: "bg-red-500",
        accent: "border-red-500",
        hover: "hover:bg-red-100",
      }
    case "General Science":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badge: "bg-emerald-500",
        accent: "border-emerald-500",
        hover: "hover:bg-emerald-100",
      }
    case "Social Studies & Civics":
    default:
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        badge: "bg-blue-500",
        accent: "border-blue-500",
        hover: "hover:bg-blue-100",
      }
  }
}
