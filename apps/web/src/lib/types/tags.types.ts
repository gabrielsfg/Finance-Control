export type TagItem = {
  id: number;
  name: string;
  /** How many transactions carry this tag. Only the management list needs it. */
  transactionCount?: number;
};

export type UpdateTagRequest = {
  name: string;
  /**
   * Fold this tag into the existing one that already answers to the new name, moving its
   * transactions over. Without it the API refuses a name that is already taken.
   */
  merge?: boolean;
};
