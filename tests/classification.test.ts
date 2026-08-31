import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyJobCategory, classifyLevel, classifyRole, inferCountry, isRemoteLocation } from '../scripts/lib/classification';

test('classifies supported functions with AI/Data taking precedence', () => {
  assert.equal(classifyRole('Machine Learning Engineer'), 'AI / Data');
  assert.equal(classifyRole('Senior Backend Engineer'), 'Engineering');
  assert.equal(classifyRole('Product Designer'), 'Product');
  assert.equal(classifyRole('Enterprise Account Executive'), 'Sales / Marketing');
  assert.equal(classifyRole('Customer Success Manager'), 'Customer');
  assert.equal(classifyRole('Senior Legal Counsel'), 'Corporate');
  assert.equal(classifyRole('Automotive Service Technician'), 'Hardware / Field');
  assert.equal(classifyRole('Clinical Research Associate'), 'Clinical / Science');
  assert.equal(classifyRole('Corporate Storyteller'), 'Other');
});

test('classifies experience levels from role titles with deterministic precedence', () => {
  assert.equal(classifyLevel('Software Engineering Intern'), 'Internship');
  assert.equal(classifyLevel('Junior Product Designer'), 'Entry level');
  assert.equal(classifyLevel('Software Engineer II'), 'Mid level');
  assert.equal(classifyLevel('Senior Machine Learning Engineer'), 'Senior');
  assert.equal(classifyLevel('Director, Customer Success'), 'Lead / Manager');
  assert.equal(classifyLevel('Vice President of Product'), 'Executive');
  assert.equal(classifyLevel('Enterprise Account Executive'), 'Unspecified');
  assert.equal(classifyLevel('Business Analyst'), 'Entry level');
  assert.equal(classifyLevel('Software Engineer I'), 'Entry level');
  assert.equal(classifyLevel('Strategic Finance Analyst II'), 'Mid level');
});

test('maps broad functions into practical job-seeker career areas', () => {
  assert.equal(classifyJobCategory('Machine Learning Engineer'), 'AI & Data');
  assert.equal(classifyJobCategory('Technical Account Manager'), 'Customer Success & Support');
  assert.equal(classifyJobCategory('Automotive Service Technician'), 'Automotive & Field Service');
  assert.equal(classifyJobCategory('Clinical Research Associate'), 'Clinical & Life Sciences');
  assert.equal(classifyJobCategory('Senior Buyer'), 'Supply Chain & Logistics');
  assert.equal(classifyJobCategory('Compensation Program Manager'), 'People & Recruiting');
  assert.equal(classifyJobCategory('Technical Program Manager'), 'Operations & Program Management');
  assert.equal(classifyJobCategory('Enterprise Account Executive'), 'Sales & Business Development');
  assert.equal(classifyJobCategory('Senior Delivery Consultant'), 'Consulting & Professional Services');
  assert.equal(classifyJobCategory('Flight Test Operator'), 'Field Operations & Deployment');
  assert.equal(classifyJobCategory('Quality Inspector'), 'Quality, Test & Safety');
  assert.equal(classifyJobCategory('Mission Systems Integration Lead'), 'Systems Engineering & Integration');
  assert.equal(classifyJobCategory('Metrology Technician'), 'Skilled Trades & Technicians');
  assert.equal(classifyJobCategory('General Manager, Local Operations'), 'Retail & Local Operations');
  assert.equal(classifyJobCategory('Financial Controller'), 'Finance & Accounting');
  assert.equal(classifyJobCategory('Registered Massage Therapist'), 'Clinical & Life Sciences');
  assert.equal(classifyJobCategory('Grocery Clerk Part Time Night'), 'Retail & Local Operations');
  assert.equal(classifyJobCategory('HVACR Technicians'), 'Skilled Trades & Technicians');
  assert.equal(classifyJobCategory('Senior Systems Programmer'), 'Software Engineering');
});

test('recognizes explicit remote location labels', () => {
  assert.equal(isRemoteLocation('Toronto, ON (Remote)'), true);
  assert.equal(isRemoteLocation('Home-based, United States'), true);
  assert.equal(isRemoteLocation('New York, NY'), false);
});

test('normalizes country names from country, city, and province labels', () => {
  assert.equal(inferCountry('Toronto, ON (Remote)'), 'Canada');
  assert.equal(inferCountry('Vancouver, British Columbia'), 'Canada');
  assert.equal(inferCountry('Vancouver, Washington, United States'), 'United States');
  assert.equal(inferCountry('San Francisco, CA'), 'United States');
  assert.equal(inferCountry('Sydney, New South Wales, Australia'), 'Australia');
  assert.equal(inferCountry('Remote - Germany'), 'Germany');
  assert.equal(inferCountry('Remote'), 'Not specified');
});
