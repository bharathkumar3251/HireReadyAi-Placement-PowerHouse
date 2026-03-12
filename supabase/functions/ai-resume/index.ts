import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const domainFallbacks: Record<string, { skills: string; programmingLanguages: string; summary: string }> = {
  "Artificial Intelligence": { skills: "Machine Learning, Deep Learning, Neural Networks, NLP, Computer Vision, TensorFlow, PyTorch, Model Deployment", programmingLanguages: "Python, R, Julia", summary: "Passionate AI engineer with hands-on experience in building intelligent systems using machine learning and deep learning frameworks. Skilled in designing models that solve real-world problems." },
  "Data Science": { skills: "Data Analysis, Statistical Modeling, Data Visualization, Feature Engineering, Pandas, NumPy, Scikit-learn, Tableau", programmingLanguages: "Python, R, SQL", summary: "Data scientist with strong analytical skills and experience in extracting actionable insights from complex datasets using statistical and machine learning techniques." },
  "Machine Learning": { skills: "Supervised Learning, Unsupervised Learning, Regression, Classification, Clustering, Model Evaluation, Hyperparameter Tuning", programmingLanguages: "Python, R", summary: "ML engineer experienced in end-to-end model development — from data preprocessing and feature engineering to model deployment and monitoring." },
  "Web Development": { skills: "React, Node.js, REST APIs, HTML5, CSS3, JavaScript, TypeScript, MongoDB, PostgreSQL, Docker, Git", programmingLanguages: "JavaScript, TypeScript, Python", summary: "Full-stack web developer with expertise in building scalable, responsive web applications using modern JavaScript frameworks and cloud technologies." },
  "Mobile App Development": { skills: "React Native, Flutter, iOS, Android, Firebase, REST APIs, State Management, UI/UX, App Store Deployment", programmingLanguages: "JavaScript, Dart, Swift, Kotlin", summary: "Mobile developer skilled in cross-platform app development delivering seamless user experiences on both iOS and Android platforms." },
  "Cyber Security": { skills: "Network Security, Penetration Testing, Vulnerability Assessment, OWASP, Ethical Hacking, Cryptography, SIEM, Firewall Configuration", programmingLanguages: "Python, Bash, C", summary: "Cyber security professional with expertise in identifying vulnerabilities, implementing security protocols, and protecting digital infrastructure from threats." },
  "Cloud Computing": { skills: "AWS, Azure, GCP, Kubernetes, Docker, Terraform, CI/CD, Microservices, Serverless Architecture, Load Balancing", programmingLanguages: "Python, Bash, Go", summary: "Cloud engineer experienced in designing and deploying scalable cloud infrastructure using leading platforms and DevOps best practices." },
  "DevOps": { skills: "Docker, Kubernetes, Jenkins, CI/CD Pipelines, Ansible, Terraform, Git, Linux, Monitoring, Prometheus, Grafana", programmingLanguages: "Python, Bash, Go, YAML", summary: "DevOps engineer focused on automating development pipelines, improving system reliability, and enabling rapid, continuous software delivery." },
  "Software Engineering": { skills: "OOP, Design Patterns, System Design, Agile/Scrum, Code Review, Unit Testing, REST APIs, Microservices, SQL, Git", programmingLanguages: "Java, C++, Python, JavaScript", summary: "Software engineer with strong foundations in system design and software architecture, building reliable and maintainable applications across the full stack." },
  "Game Development": { skills: "Unity, Unreal Engine, Game Physics, 3D Modeling, Animation, Shader Programming, Game Design, AR/VR", programmingLanguages: "C#, C++, Python, Lua", summary: "Game developer passionate about crafting immersive interactive experiences, with skills in game engine development, physics simulation, and visual scripting." },
  "Blockchain": { skills: "Solidity, Smart Contracts, Ethereum, Web3.js, DeFi, NFT, Consensus Mechanisms, Cryptography, Hyperledger", programmingLanguages: "Solidity, JavaScript, Python, Rust", summary: "Blockchain developer with hands-on experience in designing decentralized applications and smart contracts on Ethereum and other blockchain platforms." },
  "UI/UX Design": { skills: "Figma, Adobe XD, User Research, Wireframing, Prototyping, Design Systems, Accessibility, Usability Testing, Material Design", programmingLanguages: "HTML, CSS, JavaScript", summary: "UI/UX designer creating intuitive and visually compelling digital experiences through data-driven design processes and user-centered methodologies." },
  "Embedded Systems": { skills: "Microcontrollers, RTOS, Firmware Development, IoT Protocols, PCB Design, C Programming, ARM Architecture, Debugging", programmingLanguages: "C, C++, Assembly", summary: "Embedded systems engineer with expertise in low-level hardware programming, real-time operating systems, and firmware development for IoT devices." },
  "Internet of Things": { skills: "MQTT, Raspberry Pi, Arduino, Sensor Integration, IoT Protocols, Edge Computing, AWS IoT, Cloud Integration, Data Streaming", programmingLanguages: "Python, C, C++, JavaScript", summary: "IoT developer bridging the physical and digital worlds by building connected device ecosystems with real-time data processing capabilities." },
  "Networking": { skills: "TCP/IP, Routing, Switching, Cisco, Network Design, Firewall, VPN, Load Balancing, DNS, DHCP, Wireshark", programmingLanguages: "Python, Bash", summary: "Network engineer with expertise in designing, implementing, and troubleshooting complex network infrastructures for enterprise environments." },
  "Product Management": { skills: "Product Roadmap, Agile, Scrum, A/B Testing, User Stories, Stakeholder Management, Data Analytics, Market Research, JIRA", programmingLanguages: "SQL, Python (analytics)", summary: "Product manager driving product strategy and execution by aligning cross-functional teams around user needs and business objectives." },
  "Digital Marketing": { skills: "SEO, SEM, Social Media Marketing, Content Strategy, Google Analytics, Email Marketing, PPC, CRM, Growth Hacking", programmingLanguages: "HTML, CSS, SQL", summary: "Digital marketing specialist with expertise in data-driven marketing campaigns, SEO optimization, and building brand presence across digital channels." },
  "Finance & Analytics": { skills: "Financial Modeling, Excel, Power BI, SQL, Python, Risk Analysis, Forecasting, Tableau, Bloomberg, Quantitative Analysis", programmingLanguages: "Python, R, SQL", summary: "Finance analyst with strong quantitative skills, combining financial modeling expertise with data analytics to drive strategic business decisions." },
  "Business Intelligence": { skills: "Power BI, Tableau, SQL, Data Warehousing, ETL, OLAP, KPI Dashboard Design, Business Analytics, Looker", programmingLanguages: "SQL, Python, R", summary: "Business intelligence developer transforming complex datasets into actionable insights through interactive dashboards and automated reporting solutions." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, resumeData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const domain = resumeData?.domain || "Software Engineering";

    // Try AI first
    if (LOVABLE_API_KEY) {
      try {
        let systemPrompt = "";
        let userPrompt = "";

        if (action === "suggest") {
          systemPrompt = `You are an expert resume writer specializing in ${domain}. Generate highly domain-specific, targeted resume content. Do NOT use generic text. Return ONLY valid JSON.`;
          userPrompt = `Domain: ${domain}
Name: ${resumeData.name}
Current Skills: ${resumeData.skills}
Experience: ${resumeData.experience}
Education: ${resumeData.education}
Projects: ${resumeData.projects}

Generate domain-specific improvements for ${domain}. Return JSON with exactly these fields:
{
  "summary": "2-3 sentence professional summary tailored to ${domain}",
  "skills": "comma-separated technical skills specific to ${domain}",
  "programmingLanguages": "comma-separated programming languages relevant to ${domain}"
}`;
        } else if (action === "analyze") {
          systemPrompt = "Analyze the resume and provide detailed feedback. Return JSON with: score (0-100), strengths (array), improvements (array), suggestions (array).";
          userPrompt = `Analyze this ${domain} resume:\n${JSON.stringify(resumeData)}\n\nReturn ONLY valid JSON.`;
        }

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          let jsonStr = content;
          const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) jsonStr = match[1];
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } else if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (aiErr) {
        console.error("AI call failed, using fallback:", aiErr);
      }
    }

    // Domain-specific fallback
    const fb = domainFallbacks[domain] || domainFallbacks["Software Engineering"];
    return new Response(JSON.stringify({
      summary: fb.summary,
      skills: fb.skills,
      programmingLanguages: fb.programmingLanguages,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
