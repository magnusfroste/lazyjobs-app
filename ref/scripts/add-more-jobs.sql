-- Add 10 more sample jobs

INSERT INTO jobs (
  title, company, description, location, 
  salary_min, salary_max, salary_currency,
  is_remote, employment_type, required_skills, 
  experience_level, url, posted_at, is_active
)
VALUES 
  (
    'Product Manager',
    'InnovateCo',
    'Lead product strategy and roadmap for our flagship product. Work with engineering and design teams.',
    'San Francisco, CA',
    130000, 190000, 'USD',
    false, 'full-time',
    ARRAY['Product Management', 'Agile', 'Data Analysis', 'Roadmapping'],
    'senior',
    'https://example.com/jobs/pm',
    NOW(),
    true
  ),
  (
    'UX Designer',
    'DesignHub',
    'Create beautiful and intuitive user experiences. Work on web and mobile applications.',
    'Remote',
    85000, 120000, 'USD',
    true, 'full-time',
    ARRAY['Figma', 'User Research', 'Prototyping', 'UI Design'],
    'mid',
    'https://example.com/jobs/ux',
    NOW(),
    true
  ),
  (
    'Machine Learning Engineer',
    'AI Labs',
    'Build and deploy ML models at scale. Work with large datasets and cutting-edge AI technology.',
    'Seattle, WA',
    140000, 200000, 'USD',
    false, 'full-time',
    ARRAY['Python', 'TensorFlow', 'PyTorch', 'ML', 'Deep Learning'],
    'senior',
    'https://example.com/jobs/ml',
    NOW(),
    true
  ),
  (
    'QA Engineer',
    'TestPro',
    'Ensure quality through automated and manual testing. Build test frameworks and CI/CD pipelines.',
    'Austin, TX',
    80000, 110000, 'USD',
    false, 'full-time',
    ARRAY['Selenium', 'Jest', 'Cypress', 'Testing', 'CI/CD'],
    'mid',
    'https://example.com/jobs/qa',
    NOW(),
    true
  ),
  (
    'Technical Writer',
    'DocuTech',
    'Write clear and comprehensive technical documentation. Work with engineering teams.',
    'Remote',
    70000, 95000, 'USD',
    true, 'full-time',
    ARRAY['Technical Writing', 'Documentation', 'Markdown', 'API Docs'],
    'mid',
    'https://example.com/jobs/writer',
    NOW(),
    true
  ),
  (
    'Security Engineer',
    'SecureNet',
    'Protect our infrastructure and applications. Perform security audits and implement best practices.',
    'New York, NY',
    120000, 170000, 'USD',
    false, 'full-time',
    ARRAY['Security', 'Penetration Testing', 'AWS', 'Compliance'],
    'senior',
    'https://example.com/jobs/security',
    NOW(),
    true
  ),
  (
    'Sales Engineer',
    'SalesTech',
    'Bridge the gap between sales and engineering. Provide technical expertise to customers.',
    'Boston, MA',
    100000, 150000, 'USD',
    false, 'full-time',
    ARRAY['Sales', 'Technical Presentations', 'APIs', 'Customer Success'],
    'mid',
    'https://example.com/jobs/sales-eng',
    NOW(),
    true
  ),
  (
    'Blockchain Developer',
    'CryptoStartup',
    'Build decentralized applications on Ethereum. Work with smart contracts and Web3.',
    'Remote',
    110000, 180000, 'USD',
    true, 'full-time',
    ARRAY['Solidity', 'Ethereum', 'Web3', 'Smart Contracts', 'JavaScript'],
    'mid',
    'https://example.com/jobs/blockchain',
    NOW(),
    true
  ),
  (
    'Engineering Manager',
    'LeadTech',
    'Lead a team of 5-8 engineers. Manage projects, mentor developers, and drive technical excellence.',
    'San Francisco, CA',
    150000, 220000, 'USD',
    false, 'full-time',
    ARRAY['Leadership', 'Management', 'Agile', 'Mentoring', 'Technical Strategy'],
    'lead',
    'https://example.com/jobs/eng-manager',
    NOW(),
    true
  ),
  (
    'Intern - Software Development',
    'BigTech',
    'Summer internship program. Work on real projects with mentorship from senior engineers.',
    'Multiple Locations',
    30000, 40000, 'USD',
    false, 'internship',
    ARRAY['Programming', 'Computer Science', 'Problem Solving'],
    'junior',
    'https://example.com/jobs/intern',
    NOW(),
    true
  );

SELECT 'Added 10 more jobs!' as status;
