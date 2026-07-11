export interface CRMRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | '';
  crm_note?: string;
  data_source?: 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';
  possession_time?: string;
  description?: string;
}

// Synonyms definitions (normalized, lowercased, spaces/symbols removed)
const SYNONYMS: Record<keyof CRMRecord, string[]> = {
  created_at: ['created', 'createdat', 'createdtime', 'timestamp', 'date', 'creationdate', 'uploadedat', 'joined', 'datetime', 'time'],
  name: ['name', 'fullname', 'customer', 'lead', 'client', 'person', 'first', 'firstname', 'lastname', 'customername', 'leadname', 'prospect'],
  email: ['email', 'mail', 'emailid', 'primaryemail', 'emailaddress', 'customeremail', 'leademail', 'contactemail'],
  country_code: ['countrycode', 'code', 'dialcode', 'phonecode', 'cc', 'countrydialcode'],
  mobile_without_country_code: ['phone', 'phonenumber', 'mobile', 'mobileno', 'contact', 'customermobile', 'leadmobile', 'phone1', 'mobile1', 'contactno', 'telephone', 'number'],
  company: ['company', 'companyname', 'organization', 'org', 'firm', 'business', 'employer', 'workplace'],
  city: ['city', 'town', 'locality', 'addresscity', 'suburb'],
  state: ['state', 'province', 'region', 'addressstate', 'territory'],
  country: ['country', 'nation', 'addresscountry'],
  lead_owner: ['leadowner', 'owner', 'assignedto', 'agent', 'salesrep', 'manager', 'assignee'],
  crm_status: ['crmstatus', 'status', 'leadstatus', 'stage', 'crmstage'],
  crm_note: ['crmnote', 'note', 'notes', 'remark', 'remarks', 'comment', 'comments', 'followupnotes', 'additionalinfo', 'extra', 'history'],
  data_source: ['datasource', 'source', 'leadsource', 'platform', 'campaign', 'channel'],
  possession_time: ['possessiontime', 'possession', 'time', 'timing', 'possessiondate', 'handover'],
  description: ['description', 'desc', 'details', 'about', 'summary', 'info', 'message']
};

const ALLOWED_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'] as const;
const ALLOWED_DATA_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'] as const;

// Normalize string for synonym comparison (lowercase, alphanumeric only)
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Check if value is a valid date
function isValidDate(dateStr: string): boolean {
  if (!dateStr || dateStr.trim() === '') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Extract emails from string
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

// Parse phone number into country code and mobile number
function parsePhone(phoneStr: string): { countryCode: string; mobile: string } {
  let cleaned = phoneStr.trim().replace(/[\s()-]/g, '');
  
  if (cleaned.startsWith('+')) {
    // E.164-ish format
    // Try to guess country code length (typically 1-3 digits)
    // E.g. +919876543210 -> CC: 91, Mobile: 9876543210
    // E.g. +14155552671 -> CC: 1, Mobile: 4155552671
    // We can match common country code prefixes or split by length
    // Let's look for +91, +1, etc.
    // For simplicity: if it starts with +91 (India) or +1 (US), split them.
    if (cleaned.startsWith('+91') && cleaned.length > 10) {
      return { countryCode: '+91', mobile: cleaned.substring(3) };
    }
    if (cleaned.startsWith('+1') && cleaned.length > 10) {
      return { countryCode: '+1', mobile: cleaned.substring(2) };
    }
    // Generic approach: take first 1 to 3 digits as country code, rest as mobile (if length > 10)
    if (cleaned.length > 11) {
      return { countryCode: cleaned.substring(0, cleaned.length - 10), mobile: cleaned.substring(cleaned.length - 10) };
    }
    return { countryCode: cleaned.substring(0, 3), mobile: cleaned.substring(3) };
  }
  
  // If it starts with 0 and is 11 digits (e.g. UK numbers like 07700900077), or 10 digits
  return { countryCode: '', mobile: cleaned };
}

export function localMapRecord(raw: Record<string, string>): CRMRecord | null {
  const result: Partial<CRMRecord> = {};
  
  // Track potential email and phone columns to process arrays
  const emailValues: string[] = [];
  const phoneValues: string[] = [];
  
  // Store comments/remarks for notes
  const notesList: string[] = [];
  const extraFields: string[] = [];

  // 1. Analyze each column
  for (const [key, value] of Object.entries(raw)) {
    const val = (value || '').trim();
    if (!val) continue;

    const normalizedKey = normalizeKey(key);
    
    // Find matching CRM field
    let matchedField: keyof CRMRecord | null = null;
    for (const [field, synonyms] of Object.entries(SYNONYMS)) {
      if (synonyms.some(syn => normalizedKey === syn || normalizedKey.includes(syn))) {
        matchedField = field as keyof CRMRecord;
        break;
      }
    }

    if (matchedField === 'email') {
      const extracted = extractEmails(val);
      if (extracted.length > 0) {
        emailValues.push(...extracted);
      } else if (val.includes('@')) {
        emailValues.push(val);
      }
    } else if (matchedField === 'mobile_without_country_code') {
      // Split by commas/semicolons if multiple phones are grouped
      const phones = val.split(/[,;/]/);
      for (const p of phones) {
        const cleanedPhone = p.trim().replace(/[^\d+]/g, '');
        if (cleanedPhone) phoneValues.push(cleanedPhone);
      }
    } else if (matchedField === 'created_at') {
      if (isValidDate(val)) {
        result.created_at = new Date(val).toISOString();
      }
    } else if (matchedField === 'crm_status') {
      const upperVal = val.toUpperCase().replace(/[\s_-]/g, '');
      const matchedStatus = ALLOWED_STATUSES.find(status => 
        status === upperVal || status.replace(/_/g, '') === upperVal
      );
      if (matchedStatus) {
        result.crm_status = matchedStatus;
      } else {
        // Map common synonyms
        if (val.toLowerCase().includes('follow') || val.toLowerCase().includes('good')) {
          result.crm_status = 'GOOD_LEAD_FOLLOW_UP';
        } else if (val.toLowerCase().includes('connect') || val.toLowerCase().includes('busy') || val.toLowerCase().includes('no answer')) {
          result.crm_status = 'DID_NOT_CONNECT';
        } else if (val.toLowerCase().includes('bad') || val.toLowerCase().includes('junk') || val.toLowerCase().includes('fake')) {
          result.crm_status = 'BAD_LEAD';
        } else if (val.toLowerCase().includes('done') || val.toLowerCase().includes('sale') || val.toLowerCase().includes('won') || val.toLowerCase().includes('close')) {
          result.crm_status = 'SALE_DONE';
        } else {
          result.crm_status = '';
        }
      }
    } else if (matchedField === 'data_source') {
      const lowerVal = val.toLowerCase().replace(/[\s_-]/g, '');
      const matchedSource = ALLOWED_DATA_SOURCES.find(source => 
        source === lowerVal || source.replace(/_/g, '') === lowerVal
      );
      if (matchedSource) {
        result.data_source = matchedSource;
      } else {
        // Try substring match
        const found = ALLOWED_DATA_SOURCES.find(source => lowerVal.includes(source.replace(/_/g, '')));
        result.data_source = found || '';
      }
    } else if (matchedField === 'crm_note') {
      notesList.push(val);
    } else if (matchedField) {
      // Map other single fields directly if not already mapped
      if (!result[matchedField]) {
        result[matchedField] = val as any;
      }
    } else {
      // Unmapped columns
      extraFields.push(`${key}: ${val}`);
    }
  }

  // 2. Process emails: Store first email in email. Store remaining in crm_note.
  if (emailValues.length > 0) {
    result.email = emailValues[0];
    if (emailValues.length > 1) {
      notesList.push(`Additional Emails: ${emailValues.slice(1).join(', ')}`);
    }
  }

  // 3. Process phones: Store first phone in mobile. Store remaining in crm_note.
  if (phoneValues.length > 0) {
    const firstPhone = phoneValues[0];
    const parsed = parsePhone(firstPhone);
    
    // Set mobile and country code
    result.mobile_without_country_code = parsed.mobile;
    if (parsed.countryCode) {
      result.country_code = parsed.countryCode;
    }
    
    if (phoneValues.length > 1) {
      notesList.push(`Additional Phones: ${phoneValues.slice(1).join(', ')}`);
    }
  }

  // 4. Fallback to manual country code parsing if country code is defined but mobile phone wasn't matched yet
  if (!result.country_code && result.mobile_without_country_code) {
    // Check if we also matched a country code column
    const ccVal = raw[Object.keys(raw).find(k => normalizeKey(k) === 'countrycode') || ''];
    if (ccVal) {
      result.country_code = ccVal.trim().startsWith('+') ? ccVal.trim() : `+${ccVal.trim()}`;
    }
  }

  // Skip any record that contains neither email nor mobile
  if (!result.email && !result.mobile_without_country_code) {
    return null; // Signals record skipped
  }

  // 5. Compile crm_note
  if (extraFields.length > 0) {
    notesList.push(`Extra Fields: [${extraFields.join(' | ')}]`);
  }
  if (notesList.length > 0) {
    result.crm_note = notesList.join(' | ');
  }

  // Ensure default blank values
  result.created_at = result.created_at || '';
  result.name = result.name || '';
  result.email = result.email || '';
  result.country_code = result.country_code || '';
  result.mobile_without_country_code = result.mobile_without_country_code || '';
  result.company = result.company || '';
  result.city = result.city || '';
  result.state = result.state || '';
  result.country = result.country || '';
  result.lead_owner = result.lead_owner || '';
  result.crm_status = (result.crm_status as any) || '';
  result.crm_note = result.crm_note || '';
  result.data_source = (result.data_source as any) || '';
  result.possession_time = result.possession_time || '';
  result.description = result.description || '';

  return result as CRMRecord;
}

export function localMapRecordsBatch(rawRecords: Record<string, string>[]): { imported: CRMRecord[]; skippedCount: number } {
  const imported: CRMRecord[] = [];
  let skippedCount = 0;

  for (const raw of rawRecords) {
    const mapped = localMapRecord(raw);
    if (mapped) {
      imported.push(mapped);
    } else {
      skippedCount++;
    }
  }

  return { imported, skippedCount };
}
