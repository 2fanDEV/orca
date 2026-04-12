export interface UserInputRequest {
  message: string;
  placeholder?: string;
  allowEmpty?: boolean;
}

export class UserInputRequiredError extends Error {
  readonly request: UserInputRequest;

  constructor(request: UserInputRequest) {
    super(formatUserInputRequest(request));
    this.name = "UserInputRequiredError";
    this.request = request;
  }
}

export function formatUserInputRequest(request: UserInputRequest) {
  const placeholder = request.placeholder
    ? `\nSuggested input: ${request.placeholder}`
    : "";
  const optionalLabel = request.allowEmpty
    ? "\nThis input can be left blank."
    : "";

  return `${request.message}${placeholder}${optionalLabel}`;
}
