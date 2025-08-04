import { LocaleStr } from '../l10n';

export class ZenoxException extends Error {
  public title: LocaleStr;
  public message: LocaleStr | null;

  constructor(title: LocaleStr, message?: LocaleStr | null) {
    super(typeof title === 'string' ? title : title.translate('en-US' as any));
    this.name = 'ZenoxException';
    this.title = title;
    this.message = message || null;
  }
}

export class InvalidInputError extends ZenoxException {
  constructor(reason: LocaleStr) {
    super(
      new LocaleStr({ key: "invalid_input_error_title" }),
      reason
    );
    this.name = 'InvalidInputError';
  }
}

export class WikiCodesHeaderMismatchError extends ZenoxException {
  constructor() {
    super(new LocaleStr({ key: "wiki_codes_header_mismatch" }));
    this.name = 'WikiCodesHeaderMismatchError';
  }
}

export class WikiCodesDataMismatchError extends ZenoxException {
  constructor(reason: string) {
    super(
      new LocaleStr({ key: "wiki_codes_data_mismatch" }),
      new LocaleStr({ key: reason })
    );
    this.name = 'WikiCodesDataMismatchError';
  }
}

export class DatabaseError extends ZenoxException {
  constructor(message: string) {
    super(
      new LocaleStr({ key: "database_error_title" }),
      new LocaleStr({ key: message })
    );
    this.name = 'DatabaseError';
  }
}

export class APIError extends ZenoxException {
  constructor(message: string) {
    super(
      new LocaleStr({ key: "api_error_title" }),
      new LocaleStr({ key: message })
    );
    this.name = 'APIError';
  }
}

export class ConfigurationError extends ZenoxException {
  constructor(message: string) {
    super(
      new LocaleStr({ key: "configuration_error_title" }),
      new LocaleStr({ key: message })
    );
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends ZenoxException {
  constructor(message: string) {
    super(
      new LocaleStr({ key: "validation_error_title" }),
      new LocaleStr({ key: message })
    );
    this.name = 'ValidationError';
  }
}