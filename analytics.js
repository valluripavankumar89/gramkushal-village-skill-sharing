// Research & Community Impact Analytics Engine
// Computes socio-economic development metrics for the Village Skill Sharing System

function updateImpactDashboard(teachersList, learnersList) {
  const isTe = (window.currentLang === 'te');
  const activeTeachersCount = document.getElementById('stat-active-teachers');
  const activeLearnersCount = document.getElementById('stat-active-learners');
  const teachPercentElem = document.getElementById('stat-teach-percent');
  const offlinePercentElem = document.getElementById('stat-offline-percent');
  const economyElem = document.getElementById('stat-economy-amount');

  const teachersTotal = teachersList ? teachersList.length : 10;
  const learnersTotal = learnersList ? learnersList.length : 5;
  const projectedStudents = teachersTotal * 8; // average 8 learners per village mentor

  let totalFee = 0;
  let paidTeachers = 0;
  teachersList.forEach(t => {
    if (t.feeNumber && t.feeNumber > 0) {
      totalFee += t.feeNumber;
      paidTeachers++;
    }
  });
  const avgFee = paidTeachers > 0 ? Math.round(totalFee / paidTeachers) : 100;
  const potentialMonthlyEconomy = teachersTotal * 8 * avgFee;

  if (activeTeachersCount) activeTeachersCount.textContent = teachersTotal;
  if (activeLearnersCount) activeLearnersCount.textContent = `${projectedStudents + learnersTotal}+`;
  if (teachPercentElem) teachPercentElem.textContent = `${COMMUNITY_IMPACT_METRICS.willingToTeachPercent}%`;
  if (offlinePercentElem) offlinePercentElem.textContent = `${COMMUNITY_IMPACT_METRICS.offlinePreferencePercent}%`;
  if (economyElem) economyElem.textContent = `₹${potentialMonthlyEconomy.toLocaleString('en-IN')}`;

  renderSkillsComparisonChart('skills-comparison-chart-container', teachersList, learnersList);
  
  const teachLabel = isTe ? 'ఇతరులకు నేర్పించాలనే ఆసక్తి' : 'Villagers Willing to Teach Others';
  const offlineLabel = isTe ? 'గ్రామంలోనే ప్రత్యక్షంగా నేర్చుకునే ప్రాధాన్యత' : 'Prefer In-Person Local Offline Learning';
  const teachSubtext = isTe ? 'సిద్ధం' : 'willing';
  const offlineSubtext = isTe ? 'ఆఫ్‌లైన్' : 'offline';

  renderDonutChart('donut-teaching-container', COMMUNITY_IMPACT_METRICS.willingToTeachPercent, teachLabel, '#16a34a', teachSubtext);
  renderDonutChart('donut-offline-container', COMMUNITY_IMPACT_METRICS.offlinePreferencePercent, offlineLabel, '#2563eb', offlineSubtext);
}

function renderSkillsComparisonChart(containerId, teachersList, learnersList) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isTe = (window.currentLang === 'te');
  const skillCounts = {};
  CATEGORIES_DEF.forEach(cat => {
    skillCounts[cat.id] = {
      name: isTe ? cat.nameTe : cat.name,
      icon: cat.icon,
      mentors: 0,
      learners: 0
    };
  });

  (teachersList || []).forEach(t => {
    if (skillCounts[t.skillId]) {
      skillCounts[t.skillId].mentors++;
    }
  });

  (learnersList || []).forEach(l => {
    if (skillCounts[l.skillWanted]) {
      skillCounts[l.skillWanted].learners++;
    }
  });

  COMMUNITY_IMPACT_METRICS.skillsDistribution.forEach(item => {
    if (skillCounts[item.id]) {
      skillCounts[item.id].mentors += item.teachers;
      skillCounts[item.id].learners += item.learners;
    }
  });

  const categories = Object.values(skillCounts);
  categories.sort((a, b) => b.learners - a.learners);

  const maxVal = Math.max(...categories.map(c => Math.max(c.mentors, c.learners)), 10);

  const legendSupply = isTe ? 'అందుబాటులో ఉన్న గురువులు' : 'Available Mentors (Supply)';
  const legendDemand = isTe ? 'నేర్చుకోవాలనుకుంటున్న వారు' : 'Learners Wanting Skill (Demand)';
  const labelMentors = isTe ? 'గురువులు:' : 'Mentors:';
  const labelDemand = isTe ? 'డిమాండ్:' : 'Demand:';

  let html = `
    <div class="chart-wrapper">
      <div class="chart-legend flex items-center justify-center gap-6 mb-4 text-xs md:text-sm font-bold">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-sm bg-emerald-600 inline-block"></span>
          <span>${legendSupply}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-sm bg-blue-600 inline-block"></span>
          <span>${legendDemand}</span>
        </div>
      </div>
      <div class="space-y-4">
  `;

  categories.slice(0, 7).forEach(cat => {
    const mentorPct = Math.round((cat.mentors / maxVal) * 100);
    const learnerPct = Math.round((cat.learners / maxVal) * 100);

    html += `
      <div class="skill-row bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <span class="text-xl">${cat.icon}</span>
            <span>${cat.name}</span>
          </span>
          <span class="text-xs font-semibold text-slate-600">
            ${labelMentors} <b class="text-emerald-700">${cat.mentors}</b> | ${labelDemand} <b class="text-blue-700">${cat.learners}</b>
          </span>
        </div>
        
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <div class="w-20 text-right text-xs text-emerald-800 font-bold shrink-0">${labelMentors}</div>
            <div class="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
              <div class="bg-emerald-600 h-full rounded-full transition-all duration-700" style="width: ${Math.max(mentorPct, 4)}%"></div>
            </div>
            <span class="text-xs font-bold text-emerald-900 w-8">${cat.mentors}</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="w-20 text-right text-xs text-blue-800 font-bold shrink-0">${labelDemand}</div>
            <div class="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
              <div class="bg-blue-600 h-full rounded-full transition-all duration-700" style="width: ${Math.max(learnerPct, 4)}%"></div>
            </div>
            <span class="text-xs font-bold text-blue-900 w-8">${cat.learners}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

function renderDonutChart(containerId, percentage, label, colorHex, subtext) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-sm border border-slate-200">
      <div class="relative w-36 h-36 flex items-center justify-center">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="#f1f5f9" stroke-width="12" />
          <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="${colorHex}" stroke-width="12" 
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" class="transition-all duration-1000" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-3xl font-black text-slate-900">${percentage}%</span>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">${subtext}</span>
        </div>
      </div>
      <p class="mt-3 text-center font-bold text-slate-800 text-sm">${label}</p>
    </div>
  `;
}

function exportImpactReportCSV(teachersList, learnersList) {
  const headers = [
    "Type",
    "Name",
    "Village",
    "Skill_Title",
    "Skill_Category",
    "Fee_or_Budget",
    "Contact_Phone",
    "Mode"
  ];

  const rows = [];
  (teachersList || []).forEach(t => {
    rows.push([
      "Teacher/Mentor",
      `"${(t.name || '').replace(/"/g, '""')}"`,
      `"${(t.village || '').replace(/"/g, '""')}"`,
      `"${(t.skillTitle || '').replace(/"/g, '""')}"`,
      `"${(t.skillId || '').replace(/"/g, '""')}"`,
      `"${(t.fee || '').replace(/"/g, '""')}"`,
      `"${t.phone || ''}"`,
      "Offline Village Training"
    ]);
  });

  (learnersList || []).forEach(l => {
    rows.push([
      "Learner",
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.village || '').replace(/"/g, '""')}"`,
      `"${(l.skillTitle || '').replace(/"/g, '""')}"`,
      `"${(l.skillWanted || '').replace(/"/g, '""')}"`,
      `"${(l.budget || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      "Offline In-person"
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `GramKushal_Skill_Sharing_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
