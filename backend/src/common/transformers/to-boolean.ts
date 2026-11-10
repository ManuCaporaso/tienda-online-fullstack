export const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value === true || value === 'true' || value === '1' || value === 1;
};
