export const LOCATION_LIMITS = {
  title: 24,
  contactInfo: 245,
  description: 889,
};

export function validateLocationTextFields(values, t) {
  const title = String(values?.title ?? "");
  const description = String(values?.description ?? "");
  const contactInfo = String(values?.contactInfo ?? "");

  const titleTrimmed = title.trim();
  const descriptionTrimmed = description.trim();
  const contactTrimmed = contactInfo.trim();

  const errors = {
    title: "",
    description: "",
    contactInfo: "",
  };

  if (!titleTrimmed) {
    errors.title = t
      ? t("locationForm.errors.titleRequired", "Title is required")
      : "Title is required";
  } else if (titleTrimmed.length > LOCATION_LIMITS.title) {
    errors.title = t
      ? t(
          "locationForm.errors.titleMax",
          `Title must be at most ${LOCATION_LIMITS.title} characters`,
        )
      : `Title must be at most ${LOCATION_LIMITS.title} characters`;
  }

  if (!descriptionTrimmed) {
    errors.description = t
      ? t("locationForm.errors.descriptionRequired", "Description is required")
      : "Description is required";
  } else if (descriptionTrimmed.length > LOCATION_LIMITS.description) {
    errors.description = t
      ? t(
          "locationForm.errors.descriptionMax",
          `Description must be at most ${LOCATION_LIMITS.description} characters`,
        )
      : `Description must be at most ${LOCATION_LIMITS.description} characters`;
  }

  if (contactTrimmed.length > LOCATION_LIMITS.contactInfo) {
    errors.contactInfo = t
      ? t(
          "locationForm.errors.contactMax",
          `Contacts must be at most ${LOCATION_LIMITS.contactInfo} characters`,
        )
      : `Contacts must be at most ${LOCATION_LIMITS.contactInfo} characters`;
  }

  return errors;
}

export function hasLocationTextFieldErrors(errors) {
  return Boolean(errors.title || errors.description || errors.contactInfo);
}
