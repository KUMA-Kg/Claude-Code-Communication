/**
 * English Translation Resources
 */

const enTranslations = {
  common: {
    // Basic UI Elements
    'app.title': 'IT Subsidy Application Support System',
    'nav.home': 'Home',
    'nav.subsidies': 'Subsidies',
    'nav.apply': 'Apply',
    'nav.guide': 'Guide',
    'nav.contact': 'Contact',
    
    // Buttons
    'button.next': 'Next',
    'button.back': 'Back',
    'button.submit': 'Submit',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.download': 'Download',
    'button.print': 'Print',
    'button.edit': 'Edit',
    'button.delete': 'Delete',
    'button.close': 'Close',
    
    // Common Messages
    'message.loading': 'Loading...',
    'message.saving': 'Saving...',
    'message.success': 'Successfully completed',
    'message.error': 'An error occurred',
    'message.required': 'Required field',
    
    // Language Switch
    'language.switch': 'Language',
    'language.japanese': '日本語',
    'language.english': 'English'
  },
  
  subsidies: {
    // Subsidy Types
    'type.it': 'IT Implementation Subsidy',
    'type.jizokuka': 'Business Continuity Subsidy',
    'type.monozukuri': 'Manufacturing Subsidy',
    
    // Subsidy Details
    'detail.maxAmount': 'Maximum Subsidy Amount',
    'detail.subsidyRate': 'Subsidy Rate',
    'detail.applicationPeriod': 'Application Period',
    'detail.eligibility': 'Eligible Businesses',
    'detail.requirements': 'Application Requirements',
    'detail.documents': 'Required Documents',
    
    // Status
    'status.accepting': 'Accepting Applications',
    'status.closed': 'Applications Closed',
    'status.preparing': 'Preparing',
    
    // Flow
    'flow.step1': 'Basic Questions',
    'flow.step2': 'Subsidy Selection',
    'flow.step3': 'Document Check',
    'flow.step4': 'Application Form',
    'flow.step5': 'Review & Submit'
  },
  
  forms: {
    // Form Fields
    'field.companyName': 'Company Name',
    'field.companyNameKana': 'Company Name (Kana)',
    'field.corporateNumber': 'Corporate Number',
    'field.postalCode': 'Postal Code',
    'field.address': 'Address',
    'field.phoneNumber': 'Phone Number',
    'field.email': 'Email',
    'field.representative': 'Representative Name',
    'field.establishmentDate': 'Establishment Date',
    'field.capital': 'Capital',
    'field.employees': 'Number of Employees',
    'field.industry': 'Industry',
    
    // Validation
    'validation.required': '{{field}} is required',
    'validation.email': 'Please enter a valid email address',
    'validation.phone': 'Please enter a valid phone number',
    'validation.corporateNumber': 'Please enter a 13-digit corporate number',
    'validation.postalCode': 'Please enter a valid postal code',
    'validation.minLength': '{{field}} must be at least {{min}} characters',
    'validation.maxLength': '{{field}} must be no more than {{max}} characters',
    'validation.number': 'Please enter a number',
    'validation.date': 'Please enter a valid date',
    
    // Help Text
    'help.corporateNumber': '13-digit number assigned by the National Tax Agency',
    'help.capital': 'Please enter in units of 10,000 yen',
    'help.employees': 'Please enter the number of full-time employees'
  },
  
  errors: {
    // Error Messages
    'error.general': 'An unexpected error occurred',
    'error.network': 'A network error occurred',
    'error.timeout': 'Request timed out',
    'error.notFound': 'Page not found',
    'error.unauthorized': 'Authentication required',
    'error.forbidden': 'Access denied',
    'error.validation': 'Please check your input',
    'error.fileSize': 'File size is too large',
    'error.fileType': 'Unsupported file format',
    
    // Error Solutions
    'error.tryAgain': 'Please try again',
    'error.contactSupport': 'Please contact support'
  },
  
  accessibility: {
    // Screen Reader
    'a11y.skipToMain': 'Skip to main content',
    'a11y.navigation': 'Navigation',
    'a11y.breadcrumb': 'Breadcrumb',
    'a11y.progressIndicator': 'Progress indicator',
    'a11y.currentStep': 'Current step: {{step}}',
    'a11y.totalSteps': 'of {{total}} steps',
    'a11y.required': 'Required',
    'a11y.optional': 'Optional',
    'a11y.expandMenu': 'Expand menu',
    'a11y.collapseMenu': 'Collapse menu',
    'a11y.loading': 'Loading',
    'a11y.sortAscending': 'Sort ascending',
    'a11y.sortDescending': 'Sort descending',
    
    // Error Announcements
    'a11y.errorSummary': 'There are {{count}} errors',
    'a11y.fieldError': '{{field}} has an error: {{error}}',
    
    // Success Announcements
    'a11y.saveSuccess': 'Successfully saved',
    'a11y.submitSuccess': 'Successfully submitted'
  }
};

export default enTranslations;