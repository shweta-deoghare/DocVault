// utils/getCategoriesWithDefaults.js
export const getCategoriesWithDefaults = (dbCategories) => {
  const DEFAULT_CATEGORIES = ["Business", "Personal", "Financial", "Academic"];

  // Add default categories if they are missing in db
  const mergedCategories = [...dbCategories];

  DEFAULT_CATEGORIES.forEach((defaultName) => {
    if (!dbCategories.find((c) => c.name === defaultName)) {
      mergedCategories.push({ _id: defaultName, name: defaultName });
    }
  });

  return mergedCategories;
};