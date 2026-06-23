export const mockAtsAnalysis = {
  is_demo: true,
  ats_score: 87,
  skills: ['React', 'JavaScript', 'Node.js', 'Python', 'Docker', 'FastAPI'],
  missing_skills: ['Kubernetes', 'GraphQL', 'AWS'],
  suggestions: "Ensure you quantify your achievements with specific metrics such as percentage increases. Highlight your experience with cloud deployments to cover the AWS missing skill. Consider adding a brief summary tailored to Senior Frontend roles. Include links to live deployments or GitHub repositories for your portfolio projects. Emphasize your leadership or mentorship experience to strengthen your profile for senior positions."
};

export const mockCompareResumes = {
  is_demo: true,
  summary: "Both resumes exhibit strong software engineering fundamentals. Resume #2 is slightly more aligned with modern full-stack web development due to explicit mentions of React and FastAPI.",
  ranked_resumes: [
    {
      rank: 1,
      resume_id: "Sample_FullStack_Resume",
      match_score: 92,
      strengths: ["Strong web framework experience", "Clear quantifiable metrics", "Modern tech stack"],
      weaknesses: ["Lacks DevOps experience"]
    },
    {
      rank: 2,
      resume_id: "Sample_Backend_Resume",
      match_score: 78,
      strengths: ["Deep database knowledge", "System architecture experience"],
      weaknesses: ["Missing frontend framework experience", "Formatting could be improved"]
    }
  ]
};

export const mockJobRecommendations = {
  is_demo: true,
  roles: [
    {
      title: "Senior Full Stack Engineer",
      match_percentage: 88,
      reason: "Your background in React and Python perfectly matches the typical requirements for this role. You also have strong system design skills.",
      learning_roadmap: ["Learn Advanced React Patterns", "Master Kubernetes deployments", "Study System Design"]
    },
    {
      title: "Frontend Tech Lead",
      match_percentage: 82,
      reason: "You have deep experience in UI development and have mentored junior developers, making this a logical next step.",
      learning_roadmap: ["Practice Engineering Management", "Learn Webpack internals", "Focus on Web Accessibility"]
    },
    {
      title: "Backend Engineer",
      match_percentage: 75,
      reason: "While you have full-stack skills, your FastAPI and Node.js experience is strong enough for pure backend roles.",
      learning_roadmap: ["Deep dive into PostgreSQL optimization", "Learn advanced caching strategies"]
    }
  ]
};

export const mockCoverLetter = {
  is_demo: true,
  cover_letter: `Dear Hiring Manager,

I am writing to express my strong interest in the open position at your company. With a solid foundation in software engineering and hands-on experience building scalable web applications using React and FastAPI, I am confident in my ability to make an immediate impact on your team.

In my previous roles, I successfully developed user-centric interfaces and optimized backend systems to handle high traffic loads. My passion for clean code and performance optimization aligns perfectly with the requirements mentioned in your job description.

I am particularly drawn to your company's innovative approach to AI-driven products and would welcome the opportunity to contribute my technical skills and collaborative mindset to your engineering department.

Thank you for your time and consideration. I look forward to discussing how my background, skills, and certifications will be a perfect match for this role.

Sincerely,
[Your Name]`
};

export const mockLinkedInAnalyzer = {
  is_demo: true,
  profile_strength: 85,
  headline_suggestions: [
    "Full Stack Engineer | React & FastAPI Specialist | Building AI-Driven Web Apps",
    "Software Developer passionate about scalable web architecture and modern UI/UX"
  ],
  about_suggestions: "Your About section is good, but it could be more engaging. Start with a hook about your passion for technology, then highlight 2-3 key achievements with metrics. End with a call to action or a statement about the type of roles you are currently looking for.",
  skills_to_add: ["System Design", "Agile Methodologies", "Cloud Architecture (AWS/GCP)"]
};

export const mockMockInterview = {
  is_demo: true,
  score: 8,
  feedback: "Great start! You clearly articulated your technical background and highlighted your most relevant skills. However, the answer was a bit brief and lacked a specific example of a past achievement. Interviewers love the STAR method (Situation, Task, Action, Result).",
  improved_answer: "I am a Full Stack Engineer with 4 years of experience specializing in React and Python. In my last role at TechCorp, I led the migration of a legacy dashboard to a modern React SPA, which improved load times by 40% and increased user retention. I'm passionate about building scalable AI tools, which is why I'm so excited about this opportunity."
};
