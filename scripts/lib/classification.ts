import type { JobCategory, RoleFunction, RoleLevel } from '../../src/lib/types';

const ROLE_BY_CATEGORY: Record<JobCategory, RoleFunction> = {
  'Software Engineering': 'Engineering',
  'AI & Data': 'AI / Data',
  'Product Management': 'Product',
  'Design & User Research': 'Product',
  'Sales & Business Development': 'Sales / Marketing',
  'Marketing & Communications': 'Sales / Marketing',
  'Customer Success & Support': 'Customer',
  'Consulting & Professional Services': 'Customer',
  'Operations & Program Management': 'Operations',
  'Retail & Local Operations': 'Operations',
  'Education & Content': 'Operations',
  'IT & Security': 'Engineering',
  'Hardware & Manufacturing': 'Hardware / Field',
  'Systems Engineering & Integration': 'Hardware / Field',
  'Skilled Trades & Technicians': 'Hardware / Field',
  'Quality, Test & Safety': 'Hardware / Field',
  'Field Operations & Deployment': 'Hardware / Field',
  'Automotive & Field Service': 'Hardware / Field',
  'Supply Chain & Logistics': 'Hardware / Field',
  'Clinical & Life Sciences': 'Clinical / Science',
  'Finance & Accounting': 'Corporate',
  'Legal, Risk & Compliance': 'Corporate',
  'People & Recruiting': 'Corporate',
  Other: 'Other'
};

export function classifyRole(title: string, team = ''): RoleFunction {
  return ROLE_BY_CATEGORY[classifyJobCategory(title, team)];
}

const LEVEL_RULES: Array<[RoleLevel, RegExp]> = [
  ['Internship', /\b(intern(ship)?|co[- ]?op|apprentice(ship)?)\b/i],
  ['Executive', /\b(vice president|svp|evp|vp|chief|ceo|cto|cfo|coo|ciso|cro|cpo|general manager)\b/i],
  ['Lead / Manager', /\b(manager|director|head of|team lead|lead)\b/i],
  ['Senior', /\b(senior|sr\.?|staff|principal|distinguished|fellow)\b/i],
  ['Entry level', /\b(entry[- ]level|junior|jr\.?|new grad|graduate|early career|early talent|campus hire|trainee|associate|assistant|coordinator|representative)\b/i],
  ['Mid level', /\b(mid[- ]level|intermediate|(level )?(ii|iii|2|3))\b/i],
  ['Entry level', /\b(analyst|technician|level (i|1)|engineer (i|1)|specialist (i|1))\b/i]
];

export function classifyLevel(title: string): RoleLevel {
  const normalizedTitle = title.replace(/[\/_]+/g, ' ');
  return LEVEL_RULES.find(([, rule]) => rule.test(normalizedTitle))?.[0] ?? 'Unspecified';
}

const JOB_CATEGORY_RULES: Array<[JobCategory, RegExp]> = [
  ['AI & Data', /\b(ai|artificial intelligence|machine learning|mlops|data science|data scientist|data engineer|data analyst|data analytics|data platform|data governance|data operations|data quality|data steward|data strategy|analytics|business intelligence|research scientist|quantitative|modeling)\b/i],
  ['Clinical & Life Sciences', /\b(clinical|scientist|laboratory|lab technician|biology|genomics|genetic|genetics|medical|physician|nurse|nursing|pharmacy|pharmaceutical|veterinarian|veterinary|dvm|oncology|bioinformatics|biostatistics|pathology|molecular|research associate|phlebotomist|physiotherapist|therapist|therapy|dental|dentist|anaesthesia|anesthesia|optician|pathologist)\b/i],
  ['Quality, Test & Safety', /\b(quality|test and evaluation|test & evaluation|inspection|inspector|safety|environmental health|environmental manager|ehs|validation|verification|calibration|non destructive|ndt)\b/i],
  ['Field Operations & Deployment', /\b(field service|field operations|field technical|deployment|mission readiness|flight test|test pilot|site operations|operational excellence|field representative|train and advise)\b/i],
  ['Consulting & Professional Services', /\b(consultant|consulting|advisory|professional services|delivery services)\b/i],
  ['Automotive & Field Service', /\b(automotive|auto body|autobody|auto technician|mechanic|diesel|vehicle inspection|detailer|tire|brake|reconditioning|repair|service technician|lot attendant|collision|paint technician|painter|pdr)\b/i],
  ['Retail & Local Operations', /\b(retail|store manager|branch manager|restaurant operations|hospitality|merchant operations|local operations|store operations|general manager|grocery|bakery|deli|produce clerk|meat clerk|food clerk|cashier|personal shopper|merchandis|stock unloader|team member|bartender|barista|cook|kitchen|housekeeping|laundry attendant|front desk|guest experience|food runner)\b/i],
  ['People & Recruiting', /\b(recruiter|recruiting|sourcer|talent acquisition|human resources|people (partner|operations|team|shared services)|compensation|benefits|total rewards|employee experience|learning and development|organizational development)\b/i],
  ['Supply Chain & Logistics', /\b(supply chain|demand & supply|supply planning|supply planner|logistics|warehouse|warehousing|inventory|transportation|driver|dispatcher|fleet|shipping|fulfillment|procurement|buyer|purchasing|material planner|material associate|material handler|material flow|materials|sourcing|parts|scheduler|subcontracts)\b/i],
  ['Hardware & Manufacturing', /\b(manufacturing|production|hardware|mechanical|electrical|power electronics|power conversion|firmware|embedded|robotics|aerospace|avionics|semiconductor|assembly|machinist|nc programmer|pcb|rocket motor|maintenance technician|quality technician|test technician|instrumentation|machine operator|molding operator)\b/i],
  ['IT & Security', /\b(cyber|security|information technology|system administrator|systems administrator|network engineer|help desk|desktop support|soc analyst|gsoc operator|identity and access|it support|it operations|it asset)\b/i],
  ['Systems Engineering & Integration', /\b(systems engineering|systems integration|systems and integration|systems integrator|mission systems|mission integration|mission capabilities|endurance systems|air vehicle|autonomy|payload|payloads|radar|connected warfare|advanced capabilities|enterprise systems test|integration and test|ew core)\b/i],
  ['Skilled Trades & Technicians', /\b(technicians?|cnc|machinist|welder|welding|fabricator|fitter|metrology|tooling|composite|metal plate|maintenance repair|maintenance worker|npi technician|electrician|hvac|apprentice|mécanicien|mechanic)\b/i],
  ['Customer Success & Support', /\b(customer|support|success|implementation|solutions (engineer|consultant|architect)|technical account|resolutions|client services|client engagement|concierge|member services|member experience|service representative)\b/i],
  ['Sales & Business Development', /\b(sales|account executive|account manager|account representative|business development|partnership|partnerships|partner|channel|revenue|go[- ]to[- ]market|gtm|renewal|deal desk|commercial executive|seller|capture manager)\b/i],
  ['Marketing & Communications', /\b(marketing|growth|communications|copywriter|copywriting|brand|campaign|events|public relations|social media|creative strategy|creative strategist|strategist|demand generation|community manager)\b/i],
  ['Product Management', /\b(product managers?|product management|product owner|product operations|product lead|product specialist|product analyst|product director|product strategy|product enablement|head of (digital )?product|propriétaire de produit|chef de produits?)\b/i],
  ['Design & User Research', /\b(design|designer|ux|ui|user research|researcher|creative director|art director)\b/i],
  ['Software Engineering', /\b(engineer|engineering|developer|développeur|programmer|software|devops|sre|site reliability|architect|qa|quality assurance|technical lead)\b/i],
  ['Finance & Accounting', /\b(finance|financial|accounting|accountant|controller|cfo|valuation|valuator|budget|accounts payable|accounts receivable|payroll|tax|treasury|fp&a|audit|billing|credit|underwriter|underwriting|actuarial|stock plan|sec reporting|trading)\b/i],
  ['Legal, Risk & Compliance', /\b(legal|counsel|attorney|compliance|risk|privacy|policy|government|regulatory|licensing|investigator|investigations|fraud|trust and safety|trust & safety|contracts manager|public affairs)\b/i],
  ['Education & Content', /\b(teacher|trainer|training|curriculum|education|instructional|instructor|academy|faculty|admissions|postdoctoral|research fellow|linguist|editor|writer|content|technical publications|learning specialist)\b/i],
  ['Operations & Program Management', /\b(operations|strategy|strategic|program manager|program director|project manager|program lead|programs|release manager|launch manager|business process|business operations|business partner|chief of staff|administrative|administrator|executive assistant|office manager|workplace|facilities|space planner|business analyst|analyst|advisor|enablement|optimization|planning|contracting|coordinator|supervisor|management|manager|co[- ]?op student|student intern|stagiaire|dashmart)\b/i]
];

export function classifyJobCategory(title: string, team = ''): JobCategory {
  const haystack = `${title} ${team}`.replace(/[\/_-]+/g, ' ');
  return JOB_CATEGORY_RULES.find(([, rule]) => rule.test(haystack))?.[0] ?? 'Other';
}

export function isRemoteLocation(location: string): boolean {
  return /\b(remote|anywhere|distributed|work from home|home[- ]based)\b/i.test(location);
}

const COUNTRY_RULES: Array<[string, RegExp]> = [
  ['Canada', /\b(canada|toronto|vancouver(?!,?\s*(wa|washington))|montreal|montréal|ottawa|calgary|edmonton|waterloo|kitchener|halifax|winnipeg|quebec|ontario(?!,?\s*ca\b)|british columbia|alberta|manitoba|saskatchewan|nova scotia|new brunswick|newfoundland|prince edward island|on|bc|qc|ab|mb|sk|ns|nb|nl|pe)\b/i],
  ['United Kingdom', /\b(united kingdom|uk|england|scotland|(?<!new south )wales|london|manchester|edinburgh|belfast|bristol)\b/i],
  ['Ireland', /\b(ireland|dublin|cork|galway)\b/i],
  ['Germany', /\b(germany|berlin|munich|münchen|hamburg|frankfurt|cologne)\b/i],
  ['France', /\b(france|paris|lyon|toulouse)\b/i],
  ['Spain', /\b(spain|madrid|barcelona|valencia)\b/i],
  ['Netherlands', /\b(netherlands|amsterdam|rotterdam|utrecht)\b/i],
  ['Poland', /\b(poland|warsaw|krakow|kraków|wroclaw|wrocław)\b/i],
  ['Portugal', /\b(portugal|lisbon|porto)\b/i],
  ['Italy', /\b(italy|milan|rome)\b/i],
  ['Sweden', /\b(sweden|stockholm|gothenburg)\b/i],
  ['Norway', /\b(norway|oslo)\b/i],
  ['Denmark', /\b(denmark|copenhagen)\b/i],
  ['Finland', /\b(finland|helsinki)\b/i],
  ['Switzerland', /\b(switzerland|zurich|zürich|geneva)\b/i],
  ['Austria', /\b(austria|vienna)\b/i],
  ['Belgium', /\b(belgium|brussels)\b/i],
  ['Czechia', /\b(czechia|czech republic|prague)\b/i],
  ['Romania', /\b(romania|bucharest)\b/i],
  ['Hungary', /\b(hungary|budapest)\b/i],
  ['Greece', /\b(greece|athens)\b/i],
  ['Ukraine', /\b(ukraine|kyiv|kiev)\b/i],
  ['India', /\b(india|bengaluru|bangalore|hyderabad|pune|chennai|gurugram|gurgaon|noida|mumbai|delhi)\b/i],
  ['Japan', /\b(japan|tokyo|osaka)\b/i],
  ['Singapore', /\b(singapore)\b/i],
  ['South Korea', /\b(south korea|korea|seoul)\b/i],
  ['China', /\b(china|beijing|shanghai|shenzhen)\b/i],
  ['Taiwan', /\b(taiwan|taipei)\b/i],
  ['Indonesia', /\b(indonesia|jakarta)\b/i],
  ['Philippines', /\b(philippines|manila)\b/i],
  ['Thailand', /\b(thailand|bangkok)\b/i],
  ['Vietnam', /\b(vietnam|ho chi minh|hanoi)\b/i],
  ['Malaysia', /\b(malaysia|kuala lumpur)\b/i],
  ['United Arab Emirates', /\b(united arab emirates|uae|dubai|abu dhabi)\b/i],
  ['Israel', /\b(israel|tel aviv|jerusalem)\b/i],
  ['Australia', /\b(australia|sydney|melbourne|brisbane|perth|canberra)\b/i],
  ['New Zealand', /\b(new zealand|auckland|wellington)\b/i],
  ['Mexico', /\b(mexico|mexico city|guadalajara|monterrey)\b/i],
  ['Brazil', /\b(brazil|brasil|são paulo|sao paulo|rio de janeiro)\b/i],
  ['Argentina', /\b(argentina|buenos aires)\b/i],
  ['Colombia', /\b(colombia|bogota|bogotá|medellin|medellín)\b/i],
  ['Chile', /\b(chile|santiago)\b/i],
  ['Costa Rica', /\b(costa rica|san josé|san jose, costa)\b/i],
  ['South Africa', /\b(south africa|johannesburg|cape town)\b/i],
  ['Kenya', /\b(kenya|nairobi)\b/i],
  ['Nigeria', /\b(nigeria|lagos)\b/i],
  ['United States', /\b(united states|usa|u\.s\.?|new york|san francisco|los angeles|seattle|boston|chicago|austin|denver|atlanta|washington,? dc|california|texas|florida|massachusetts|colorado|georgia|virginia|arizona|oregon|pennsylvania|north carolina|south carolina|new jersey|new york|ohio|michigan|minnesota|utah|tennessee|maryland|connecticut|ca|ny|tx|wa|ma|il|co|ga|va|az|or|pa|nc|sc|nj|oh|mi|mn|ut|tn|md|ct)\b/i]
];

export function inferCountry(location: string): string {
  return COUNTRY_RULES.find(([, rule]) => rule.test(location))?.[0] ?? 'Not specified';
}
