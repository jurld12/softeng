let achievementsPageSummary = null;
let achievementsBadgeStates = [];
let achievementsBiometricStats = createEmptyBiometricStats();
let activeBadgeFilter = 'all';
let activeMilestoneFilter = 'ongoing';

const RECENT_HEALTH_ENTRY_KEY = 'healio_recent_health_entry';
const LAST_POINTS_SEEN_KEY = 'healio_last_seen_points';

const MOTIVATION_QUOTES = [
    'Small healthy choices today build a stronger tomorrow.',
    'Consistency beats intensity. Keep your streak alive.',
    'Each data log is proof that you are showing up for yourself.',
    'Progress is a pattern, and you are building it one entry at a time.',
    'Your future health is shaped by the habits you repeat now.',
    'Momentum grows when you keep going, even on ordinary days.',
    'Discipline with your health data turns goals into outcomes.'
];

const BADGE_ART_THEMES = {
    first_entry: { start: '#2563eb', end: '#06b6d4', rim: '#f59e0b', symbol: '🎯' },
    week_streak: { start: '#f97316', end: '#ef4444', rim: '#facc15', symbol: '🔥' },
    month_streak: { start: '#0f766e', end: '#22c55e', rim: '#eab308', symbol: '🏆' },
    consistent_tracker: { start: '#0284c7', end: '#14b8a6', rim: '#22d3ee', symbol: '📊' },
    data_master: { start: '#4338ca', end: '#7c3aed', rim: '#f59e0b', symbol: '⭐' },
    heart_health: { start: '#ec4899', end: '#ef4444', rim: '#fda4af', symbol: '❤️' },
    step_crusher: { start: '#16a34a', end: '#0ea5e9', rim: '#fde047', symbol: '👟' },
    sleep_champion: { start: '#4f46e5', end: '#6366f1', rim: '#a78bfa', symbol: '😴' },
    wellness_warrior: { start: '#059669', end: '#14b8a6', rim: '#facc15', symbol: '💪' },
    default: { start: '#334155', end: '#0ea5e9', rim: '#cbd5e1', symbol: '🏅' }
};

const BADGE_ART_CACHE = {};

const BADGE_LIBRARY = [
    {
        id: 'first_entry',
        name: 'First Steps',
        description: 'Logged your first health data entry',
        icon: '🎯',
        points: 10,
        milestoneIcon: 'bi-rocket-takeoff-fill',
        criteria: { type: 'entries', target: 1, unit: 'entries' }
    },
    {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Logged data for 7 consecutive days',
        icon: '🔥',
        points: 50,
        milestoneIcon: 'bi-fire',
        criteria: { type: 'streak', target: 7, unit: 'streak days' }
    },
    {
        id: 'month_streak',
        name: 'Monthly Champion',
        description: 'Logged data for 30 consecutive days',
        icon: '🏆',
        points: 200,
        milestoneIcon: 'bi-calendar2-week-fill',
        criteria: { type: 'streak', target: 30, unit: 'streak days' }
    },
    {
        id: 'consistent_tracker',
        name: 'Consistent Tracker',
        description: 'Logged 50 total entries',
        icon: '📊',
        points: 100,
        milestoneIcon: 'bi-bar-chart-line-fill',
        criteria: { type: 'entries', target: 50, unit: 'entries' }
    },
    {
        id: 'data_master',
        name: 'Data Master',
        description: 'Logged 100 total entries',
        icon: '⭐',
        points: 250,
        milestoneIcon: 'bi-award-fill',
        criteria: { type: 'entries', target: 100, unit: 'entries' }
    },
    {
        id: 'heart_health',
        name: 'Heart Health Guardian',
        description: 'Logged heart rate 20 times',
        icon: '❤️',
        points: 75,
        milestoneIcon: 'bi-heart-pulse-fill',
        criteria: { type: 'metric_count', metric: 'heart_rate', target: 20, unit: 'heart logs' }
    },
    {
        id: 'step_crusher',
        name: 'Step Crusher',
        description: 'Logged 10,000+ steps in a single day',
        icon: '👟',
        points: 50,
        milestoneIcon: 'bi-person-walking',
        criteria: { type: 'metric_peak', metric: 'steps', target: 10000, unit: 'steps peak' }
    },
    {
        id: 'sleep_champion',
        name: 'Sleep Champion',
        description: 'Logged 8+ hours of sleep',
        icon: '😴',
        points: 30,
        milestoneIcon: 'bi-moon-stars-fill',
        criteria: { type: 'metric_peak', metric: 'sleep_hours', target: 8, unit: 'hours peak' }
    },
    {
        id: 'wellness_warrior',
        name: 'Wellness Warrior',
        description: 'Logged all metric types at least once',
        icon: '💪',
        points: 100,
        milestoneIcon: 'bi-shield-fill-check',
        criteria: {
            type: 'metric_coverage',
            metrics: ['heart_rate', 'steps', 'calories', 'blood_glucose', 'sleep_hours'],
            target: 5,
            unit: 'metric types'
        }
    }
];

const MILESTONE_ROADMAP = [
    { type: 'badge', badgeId: 'first_entry' },
    {
        type: 'level',
        level: 2,
        title: 'Level 2: Momentum Starter',
        subtitle: 'Reach 100 total points',
        icon: 'bi-stars'
    },
    { type: 'badge', badgeId: 'week_streak' },
    { type: 'badge', badgeId: 'consistent_tracker' },
    {
        type: 'level',
        level: 5,
        title: 'Level 5: Focus Engine',
        subtitle: 'Reach 400 total points',
        icon: 'bi-lightning-charge-fill'
    },
    { type: 'badge', badgeId: 'heart_health' },
    { type: 'badge', badgeId: 'wellness_warrior' },
    { type: 'badge', badgeId: 'month_streak' },
    { type: 'badge', badgeId: 'data_master' },
    {
        type: 'level',
        level: 10,
        title: 'Level 10: Elite Tracker',
        subtitle: 'Reach 900 total points',
        icon: 'bi-gem'
    }
];

function createEmptyBiometricStats() {
    return {
        metricCounts: {},
        metricPeaks: {},
        metricTypes: new Set()
    };
}

function checkAuthentication() {
    if (typeof ensureAuthenticated === 'function') {
        return ensureAuthenticated({
            requiredRole: 'patient',
            allowMissingRole: true
        });
    }

    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }

    if (role && role !== 'patient') {
        alert('Access denied. This page is for patients only.');
        window.location.href = 'login-v2.html';
        return false;
    }

    return true;
}

window.logout = async function() {
    if (typeof performLogout === 'function') {
        await performLogout();
        return;
    }

    try {
        await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGOUT), {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
        window.location.href = 'login-v2.html';
    }
};

document.addEventListener('DOMContentLoaded', initializeAchievementsPage);

async function initializeAchievementsPage() {
    if (!checkAuthentication()) {
        return;
    }

    bindBadgeFilters();
    bindMilestoneFilters();
    setDailyMotivationQuote();

    await loadCurrentUser();
    await loadGamificationSummary();
    await loadAchievements();

    maybeShowRecentEntryToast();
}

async function loadCurrentUser() {
    try {
        const response = await fetch(getApiUrl('/auth/me'), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return;
            }
            return;
        }

        const user = await response.json();
        const userName = user?.name || 'User';

        const nameEl = document.getElementById('sidebarUserName');
        const emailEl = document.getElementById('sidebarUserEmail');
        if (nameEl) nameEl.textContent = userName;
        if (emailEl) emailEl.textContent = user?.email || '';

        setText('playerPanelName', userName);
        setText('playerPanelJoined', formatJoinedLabel(user?.created_at));

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff`;
        const avatars = document.querySelectorAll('img[alt="Profile"]');
        avatars.forEach((avatar) => {
            avatar.src = avatarUrl;
        });

        const panelAvatar = document.getElementById('playerPanelAvatar');
        if (panelAvatar) {
            panelAvatar.src = avatarUrl;
        }
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}

async function loadGamificationSummary() {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_GAMIFICATION || '/patients/me/gamification';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return;
            }
            throw new Error('Failed to load gamification summary');
        }

        const summary = await response.json();
        achievementsPageSummary = summary;
        achievementsBiometricStats = await loadBiometricStats();
        achievementsBadgeStates = buildBadgeStates(summary, achievementsBiometricStats);

        renderSummary(summary);
        renderProgressInsights(summary, achievementsBadgeStates);
        renderMilestones(summary, achievementsBadgeStates);
        renderBadges(achievementsBadgeStates);
        maybeShowLevelUpToast(summary);
    } catch (error) {
        console.error('Error loading gamification summary:', error);
        achievementsPageSummary = null;
        achievementsBadgeStates = [];
        renderSummary(null);
        renderProgressInsights(null, []);
        renderMilestones(null, []);
        renderBadges([], true);
    }
}

async function loadBiometricStats() {
    const endpoint = '/patients/me/biometrics?limit=1000';
    const fallback = createEmptyBiometricStats();

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return fallback;
            }
            return fallback;
        }

        const entries = await response.json();
        if (!Array.isArray(entries)) {
            return fallback;
        }

        const metricCounts = {};
        const metricPeaks = {};
        const metricTypes = new Set();

        entries.forEach((entry) => {
            const metric = String(entry?.metric || '').toLowerCase();
            if (!metric) {
                return;
            }

            metricTypes.add(metric);
            metricCounts[metric] = (metricCounts[metric] || 0) + 1;

            const numericValue = Number(entry?.value);
            if (Number.isFinite(numericValue)) {
                const previousPeak = Number.isFinite(metricPeaks[metric]) ? metricPeaks[metric] : Number.NEGATIVE_INFINITY;
                metricPeaks[metric] = Math.max(previousPeak, numericValue);
            }
        });

        return {
            metricCounts,
            metricPeaks,
            metricTypes
        };
    } catch (error) {
        console.error('Error loading biometric stats:', error);
        return fallback;
    }
}

async function loadAchievements() {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_ACHIEVEMENTS || '/patients/me/achievements';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return;
            }
            throw new Error('Failed to load achievements');
        }

        const achievements = await response.json();
        const list = Array.isArray(achievements) ? achievements : [];

        if (list.length) {
            renderAchievements(list);
            return;
        }

        const fallback = deriveFromBadges(achievementsBadgeStates);
        renderAchievements(fallback, { derived: true });
    } catch (error) {
        console.error('Error loading achievements:', error);
        const fallback = deriveFromBadges(achievementsBadgeStates);
        if (fallback.length) {
            renderAchievements(fallback, { derived: true });
            return;
        }
        renderAchievements([], { error: true });
    }
}

function renderSummary(summary) {
    const points = summary?.points || {};
    const totalPoints = toSafeNumber(points.total_points);
    const level = toSafeNumber(points.level, 1, 1);
    const rank = Number.isFinite(Number(points.rank)) && Number(points.rank) > 0 ? `#${Number(points.rank)}` : '-';
    const streak = toSafeNumber(summary?.current_streak);
    const badgesEarned = toSafeNumber(summary?.badges_earned);
    const totalBadges = toSafeNumber(summary?.total_badges_available);

    setText('achievementsPointsValue', totalPoints.toLocaleString());
    setText('achievementsLevelValue', String(level));
    setText('achievementsRankValue', rank);
    setText('achievementsStreakValue', `${streak} day${streak === 1 ? '' : 's'}`);
    setText('achievementsBadgeProgress', `${badgesEarned} / ${totalBadges} badges unlocked`);
}

function renderProgressInsights(summary, badgeStates) {
    if (!summary) {
        setText('levelTrackTitle', 'Level progress unavailable');
        setText('levelTrackMeta', 'Unable to calculate level progress right now.');
        setText('levelPiePercent', '0%');
        setPieProgress('levelPieRing', 0);

        setText('badgeTrackTitle', 'Badge progress unavailable');
        setText('badgeTrackMeta', 'Unable to calculate badge progress right now.');
        setText('badgePiePercent', '0%');
        setPieProgress('badgePieRing', 0);
        setText('badgeTrackHint', 'Try refreshing the page in a moment.');
        setText('motivationHintText', 'Progress details will appear after data loads.');
        return;
    }

    const totalPoints = toSafeNumber(summary?.points?.total_points);
    const level = toSafeNumber(summary?.points?.level, 1, 1);
    const pointsIntoCurrentLevel = totalPoints % 100;
    const pointsNeeded = pointsIntoCurrentLevel === 0 ? 100 : 100 - pointsIntoCurrentLevel;
    const levelProgressPercent = clamp((pointsIntoCurrentLevel / 100) * 100, 0, 100);

    setText('levelTrackTitle', `Level ${level} to Level ${level + 1}`);
    setText('levelTrackMeta', `${pointsNeeded} points to next level`);
    setPieProgress('levelPieRing', levelProgressPercent, 'levelPiePercent');

    const nextBadge = getTopLockedBadge(badgeStates);
    if (!nextBadge) {
        setText('badgeTrackTitle', 'All badges unlocked');
        setText('badgeTrackMeta', 'Amazing consistency. You completed every badge.');
        setPieProgress('badgePieRing', 100, 'badgePiePercent');
        setText('badgeTrackHint', 'Keep adding health data to maintain your streak and points lead.');
        setText('motivationHintText', 'You have completed the badge board. Keep your streak alive.');
        return;
    }

    const badgeProgressPercent = Math.round(clamp(nextBadge.progress.ratio * 100, 0, 100));
    setText('badgeTrackTitle', `${nextBadge.icon} ${nextBadge.name}`);
    setText('badgeTrackMeta', nextBadge.progress.label);
    setPieProgress('badgePieRing', badgeProgressPercent, 'badgePiePercent');
    setText('badgeTrackHint', nextBadge.progress.detail || nextBadge.description);
    setText('motivationHintText', `Focus: ${nextBadge.name}. ${nextBadge.progress.detail || 'Keep going.'}`);
}

function renderMilestones(summary, badgeStates) {
    const container = document.getElementById('milestoneRoadmap');
    if (!container) {
        return;
    }

    if (!summary || !Array.isArray(badgeStates) || !badgeStates.length) {
        container.innerHTML = '<div class="gamification-empty">Milestones are not available right now.</div>';
        setText('milestoneCountPill', '0 / 0 complete');
        return;
    }

    const milestones = buildMilestoneStates(summary, badgeStates);
    const completedCount = milestones.filter((milestone) => milestone.unlocked).length;
    setText('milestoneCountPill', `${completedCount} / ${milestones.length} complete`);

    const filteredMilestones = milestones.filter(matchesMilestoneFilter);
    if (!filteredMilestones.length) {
        container.innerHTML = `<div class="gamification-empty">${escapeHtml(getMilestoneFilterEmptyMessage())}</div>`;
        return;
    }

    const nextMilestone = milestones
        .filter((milestone) => !milestone.unlocked)
        .sort((a, b) => b.progressRatio - a.progressRatio)[0];

    container.innerHTML = filteredMilestones.map((milestone) => {
        const progressPercent = Math.round(clamp(milestone.progressRatio * 100, 0, 100));
        const activeClass = (!milestone.unlocked && nextMilestone && nextMilestone.id === milestone.id) ? 'is-active' : '';
        const unlockedClass = milestone.unlocked ? 'is-unlocked' : '';
        const statusText = milestone.unlocked ? 'Completed' : (activeClass ? 'Up next' : 'In progress');
        const pieClass = milestone.unlocked
            ? 'pie-ring pie-ring-sm pie-ring-success milestone-pie'
            : 'pie-ring pie-ring-sm milestone-pie';

        return `
            <article class="milestone-item ${activeClass} ${unlockedClass}">
                <div class="milestone-item__badge"><i class="bi ${escapeHtml(milestone.icon)}"></i></div>
                <div class="milestone-item__content">
                    <div class="milestone-item__head">
                        <h3 class="milestone-item__title">${escapeHtml(milestone.title)}</h3>
                        <span class="milestone-item__status">${statusText}</span>
                    </div>
                    <p class="milestone-item__subtitle">${escapeHtml(milestone.subtitle)}</p>
                    <div class="milestone-item__meta">
                        <span>${escapeHtml(milestone.progressLabel)}</span>
                        <span>${escapeHtml(milestone.progressDetail)}</span>
                    </div>
                </div>
                <div class="${pieClass}" style="--progress: ${progressPercent}%;">
                    <span>${progressPercent}%</span>
                </div>
            </article>
        `;
    }).join('');
}

function renderBadges(badgeStates, isError = false) {
    const container = document.getElementById('achievementBadgesGrid');
    if (!container) {
        return;
    }

    if (isError) {
        container.innerHTML = '<div class="gamification-empty">Unable to load badges right now.</div>';
        return;
    }

    const list = Array.isArray(badgeStates) ? badgeStates : [];
    if (!list.length) {
        container.innerHTML = '<div class="gamification-empty">No badge catalog available.</div>';
        return;
    }

    const visibleBadges = list.filter((badge) => {
        if (activeBadgeFilter === 'unlocked') {
            return badge.unlocked;
        }
        if (activeBadgeFilter === 'locked') {
            return !badge.unlocked;
        }
        return true;
    });

    setText(
        'badgeGallerySubtitle',
        `Showing ${visibleBadges.length} of ${list.length} badges (${list.filter((badge) => badge.unlocked).length} unlocked).`
    );

    if (!visibleBadges.length) {
        container.innerHTML = '<div class="gamification-empty">No badges in this filter yet.</div>';
        return;
    }

    container.innerHTML = visibleBadges.map((badge) => {
        const progressPercent = Math.round(clamp(badge.progress.ratio * 100, 0, 100));
        const unlockedClass = badge.unlocked ? 'is-unlocked' : 'is-locked';
        const title = escapeHtml(String(badge.name || 'Badge'));
        const description = escapeHtml(String(badge.progress.detail || badge.description || 'Track progress to unlock this badge.'));
        const caption = badge.unlocked
            ? escapeHtml(formatDateLabel(badge.date_awarded, 'Unlocked'))
            : escapeHtml(badge.progress.label);
        const pieClass = badge.unlocked
            ? 'pie-ring pie-ring-xs pie-ring-success badge-gallery-pie'
            : 'pie-ring pie-ring-xs badge-gallery-pie';
        const artSrc = badge.artSrc || getBadgeArtDataUri(badge.id, badge.icon);
        const statusIcon = badge.unlocked ? 'bi-check-lg' : 'bi-lock-fill';
        const statusClass = badge.unlocked ? 'is-unlocked' : '';

        return `
            <article class="badge-gallery-item ${unlockedClass}" title="${description}">
                <div class="badge-gallery-thumb">
                    <img src="${artSrc}" alt="${title} badge icon" class="badge-gallery-art" loading="lazy">
                    <span class="badge-gallery-lock ${statusClass}"><i class="bi ${statusIcon}"></i></span>
                </div>
                <div class="badge-gallery-name">${title}</div>
                <div class="badge-gallery-caption">${caption}</div>
                <div class="${pieClass}" style="--progress: ${progressPercent}%;">
                    <span>${progressPercent}</span>
                </div>
            </article>
        `;
    }).join('');
}

function renderAchievements(items, options = {}) {
    const container = document.getElementById('achievementsList');
    if (!container) {
        return;
    }

    const { derived = false, error = false } = options;

    if (error) {
        container.innerHTML = '<div class="gamification-empty">Unable to load achievements right now.</div>';
        setText('achievementCountPill', '0 items');
        return;
    }

    const list = Array.isArray(items) ? items : [];
    setText('achievementCountPill', `${list.length} item${list.length === 1 ? '' : 's'}`);

    if (!list.length) {
        container.innerHTML = '<div class="gamification-empty">No achievements unlocked yet. Keep using Healio to reach your first milestone.</div>';
        return;
    }

    container.innerHTML = list.map((item) => {
        const title = escapeHtml(String(item?.title || item?.name || 'Achievement'));
        const description = escapeHtml(String(item?.description || 'Milestone unlocked.'));
        const dateLabel = escapeHtml(formatDateLabel(item?.date_awarded, 'Unlocked'));

        const pointsRaw = Number(item?.points);
        const pointsLabel = Number.isFinite(pointsRaw)
            ? `+${Math.round(pointsRaw)} pts`
            : (derived ? 'From badge progress' : 'Achievement');

        return `
            <article class="gamification-achievement">
                <div class="achievement-history-title">
                    <span class="achievement-history-icon"><i class="bi bi-trophy-fill"></i></span>
                    <span class="gamification-achievement__title">${title}</span>
                </div>
                <div class="gamification-achievement__description">${description}</div>
                <div class="gamification-achievement__meta">
                    <span>${dateLabel}</span>
                    <span class="gamification-achievement__points">${escapeHtml(pointsLabel)}</span>
                </div>
            </article>
        `;
    }).join('');
}

function deriveFromBadges(badgeStates) {
    if (!Array.isArray(badgeStates) || !badgeStates.length) {
        return [];
    }

    return badgeStates
        .filter((badge) => badge.unlocked)
        .slice(0, 12)
        .map((badge) => ({
            title: badge.name,
            description: badge.description,
            points: badge.points,
            date_awarded: badge.date_awarded
        }));
}

function bindBadgeFilters() {
    const group = document.getElementById('badgeFilterGroup');
    if (!group) {
        return;
    }

    group.querySelectorAll('[data-badge-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            const filter = String(button.dataset.badgeFilter || 'all').toLowerCase();
            activeBadgeFilter = ['all', 'unlocked', 'locked'].includes(filter) ? filter : 'all';

            group.querySelectorAll('[data-badge-filter]').forEach((item) => {
                item.classList.toggle('active', item === button);
            });

            renderBadges(achievementsBadgeStates);
        });
    });
}

function bindMilestoneFilters() {
    const group = document.getElementById('milestoneFilterGroup');
    if (!group) {
        return;
    }

    group.querySelectorAll('[data-milestone-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            const filter = String(button.dataset.milestoneFilter || 'ongoing').toLowerCase();
            activeMilestoneFilter = ['ongoing', 'available', 'completed'].includes(filter)
                ? filter
                : 'ongoing';

            group.querySelectorAll('[data-milestone-filter]').forEach((item) => {
                item.classList.toggle('active', item === button);
            });

            renderMilestones(achievementsPageSummary, achievementsBadgeStates);
        });
    });
}

function buildBadgeStates(summary, biometricStats) {
    const earnedBadges = Array.isArray(summary?.badges) ? summary.badges : [];
    const earnedById = new Map();
    const earnedByName = new Map();

    earnedBadges.forEach((badge) => {
        const badgeId = badge?.badge_id ? String(badge.badge_id) : '';
        const badgeName = badge?.name ? String(badge.name).toLowerCase() : '';

        if (badgeId) {
            earnedById.set(badgeId, badge);
        }
        if (badgeName) {
            earnedByName.set(badgeName, badge);
        }
    });

    return BADGE_LIBRARY.map((badge) => {
        const earnedBadge = earnedById.get(badge.id) || earnedByName.get(String(badge.name).toLowerCase()) || null;
        const progress = earnedBadge
            ? {
                ratio: 1,
                label: 'Completed',
                detail: formatDateLabel(earnedBadge?.date_awarded, 'Unlocked')
            }
            : getBadgeProgress(badge.criteria, summary, biometricStats);

        return {
            ...badge,
            unlocked: Boolean(earnedBadge),
            date_awarded: earnedBadge?.date_awarded || null,
            artSrc: getBadgeArtDataUri(badge.id, badge.icon),
            progress
        };
    }).sort((a, b) => {
        if (a.unlocked !== b.unlocked) {
            return Number(b.unlocked) - Number(a.unlocked);
        }
        return b.progress.ratio - a.progress.ratio;
    });
}

function getBadgeProgress(criteria, summary, biometricStats) {
    if (!criteria || typeof criteria !== 'object') {
        return {
            ratio: 0,
            label: '0%',
            detail: 'Track health data to unlock this badge.'
        };
    }

    const target = Number(criteria.target);
    const current = getCurrentValueByCriteria(criteria, summary, biometricStats);
    const safeTarget = Number.isFinite(target) && target > 0 ? target : 1;
    const ratio = clamp(current / safeTarget, 0, 1);

    return {
        ratio,
        label: getCriteriaProgressLabel(criteria, current, safeTarget),
        detail: getCriteriaRemainingLabel(criteria, current, safeTarget)
    };
}

function getCurrentValueByCriteria(criteria, summary, biometricStats) {
    switch (criteria.type) {
        case 'entries':
            return toSafeNumber(summary?.total_entries);
        case 'streak':
            return toSafeNumber(summary?.current_streak);
        case 'metric_count': {
            const metric = String(criteria.metric || '').toLowerCase();
            return toSafeNumber(biometricStats?.metricCounts?.[metric]);
        }
        case 'metric_peak': {
            const metric = String(criteria.metric || '').toLowerCase();
            return toSafeNumber(biometricStats?.metricPeaks?.[metric]);
        }
        case 'metric_coverage': {
            const metrics = Array.isArray(criteria.metrics) ? criteria.metrics : [];
            return metrics.reduce((count, metric) => {
                const key = String(metric || '').toLowerCase();
                const hasMetric = toSafeNumber(biometricStats?.metricCounts?.[key]) > 0;
                return count + (hasMetric ? 1 : 0);
            }, 0);
        }
        case 'level':
            return toSafeNumber(summary?.points?.level, 1, 1);
        default:
            return 0;
    }
}

function getCriteriaProgressLabel(criteria, current, target) {
    const formattedCurrent = formatProgressValue(criteria, current);
    const formattedTarget = formatProgressValue(criteria, target);
    const unit = criteria.unit ? ` ${criteria.unit}` : '';
    return `${formattedCurrent} / ${formattedTarget}${unit}`;
}

function getCriteriaRemainingLabel(criteria, current, target) {
    const remaining = Math.max(target - current, 0);
    if (remaining <= 0) {
        return 'Ready to unlock on your next sync.';
    }

    if (criteria.type === 'metric_peak' && criteria.metric === 'steps') {
        return `${formatProgressValue(criteria, remaining)} more steps in one day needed.`;
    }

    if (criteria.type === 'metric_peak' && criteria.metric === 'sleep_hours') {
        return `${formatProgressValue(criteria, remaining)} more sleep hours needed.`;
    }

    if (criteria.type === 'metric_count') {
        return `${formatProgressValue(criteria, remaining)} more logs needed.`;
    }

    if (criteria.type === 'metric_coverage') {
        return `${formatProgressValue(criteria, remaining)} more metric types to log.`;
    }

    const unit = criteria.unit || 'steps';
    return `${formatProgressValue(criteria, remaining)} more ${unit} needed.`;
}

function buildMilestoneStates(summary, badgeStates) {
    const currentLevel = toSafeNumber(summary?.points?.level, 1, 1);
    const badgeMap = new Map(badgeStates.map((badge) => [badge.id, badge]));

    return MILESTONE_ROADMAP.map((milestone) => {
        if (milestone.type === 'badge') {
            const badge = badgeMap.get(milestone.badgeId);
            if (!badge) {
                return {
                    id: milestone.badgeId,
                    title: 'Unknown milestone',
                    subtitle: 'Unavailable',
                    icon: 'bi-question-circle-fill',
                    progressRatio: 0,
                    progressLabel: '0%',
                    progressDetail: 'No data',
                    unlocked: false
                };
            }

            return {
                id: `badge-${badge.id}`,
                title: badge.name,
                subtitle: badge.description,
                icon: badge.milestoneIcon || 'bi-award-fill',
                progressRatio: badge.progress.ratio,
                progressLabel: badge.progress.label,
                progressDetail: badge.unlocked ? 'Badge earned' : badge.progress.detail,
                unlocked: badge.unlocked
            };
        }

        const levelTarget = toSafeNumber(milestone.level, 1, 1);
        const levelProgress = clamp(currentLevel / levelTarget, 0, 1);
        const levelsRemaining = Math.max(levelTarget - currentLevel, 0);

        return {
            id: `level-${levelTarget}`,
            title: milestone.title,
            subtitle: milestone.subtitle,
            icon: milestone.icon || 'bi-stars',
            progressRatio: levelProgress,
            progressLabel: `Level ${Math.min(currentLevel, levelTarget)} / ${levelTarget}`,
            progressDetail: levelsRemaining > 0 ? `${levelsRemaining} level${levelsRemaining === 1 ? '' : 's'} remaining` : 'Level reached',
            unlocked: currentLevel >= levelTarget
        };
    });
}

function matchesMilestoneFilter(milestone) {
    if (activeMilestoneFilter === 'completed') {
        return milestone.unlocked;
    }

    if (activeMilestoneFilter === 'available') {
        return !milestone.unlocked && milestone.progressRatio === 0;
    }

    return !milestone.unlocked && milestone.progressRatio > 0;
}

function getMilestoneFilterEmptyMessage() {
    if (activeMilestoneFilter === 'completed') {
        return 'No completed milestones yet. Keep tracking your health metrics.';
    }

    if (activeMilestoneFilter === 'available') {
        return 'No untouched milestones right now. Great momentum.';
    }

    return 'No ongoing milestones yet. Add new health entries to activate progress.';
}

function getTopLockedBadge(badgeStates) {
    if (!Array.isArray(badgeStates)) {
        return null;
    }

    return badgeStates
        .filter((badge) => !badge.unlocked)
        .sort((a, b) => b.progress.ratio - a.progress.ratio)[0] || null;
}

function setDailyMotivationQuote() {
    setText('motivationQuoteText', getDailyQuote());
}

function getDailyQuote() {
    const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATION_QUOTES.length;
    return MOTIVATION_QUOTES[dayIndex];
}

function getRandomQuote() {
    const index = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
    return MOTIVATION_QUOTES[index];
}

function maybeShowRecentEntryToast() {
    const raw = localStorage.getItem(RECENT_HEALTH_ENTRY_KEY);
    if (!raw) {
        return;
    }

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch (error) {
        localStorage.removeItem(RECENT_HEALTH_ENTRY_KEY);
        return;
    }

    const entryTimestamp = Date.parse(payload?.timestamp || '');
    const sixHours = 6 * 60 * 60 * 1000;
    if (!Number.isFinite(entryTimestamp) || (Date.now() - entryTimestamp) > sixHours) {
        localStorage.removeItem(RECENT_HEALTH_ENTRY_KEY);
        return;
    }

    const metric = String(payload?.metric || 'health data').trim();
    const value = payload?.value;
    const valueText = value === undefined || value === null || value === '' ? '' : ` (${value})`;
    const badges = Array.isArray(payload?.badgesEarned) ? payload.badgesEarned : [];
    const badgeNames = badges
        .map((badge) => String(badge?.name || '').trim())
        .filter(Boolean)
        .slice(0, 3);

    let message = `You logged ${metric}${valueText}. ${getRandomQuote()}`;
    if (badgeNames.length) {
        message += ` New badge${badgeNames.length > 1 ? 's' : ''}: ${badgeNames.join(', ')}.`;
    }

    showAchievementToast('Fresh Progress Recorded', message, badgeNames.length ? 'success' : 'info');
    localStorage.removeItem(RECENT_HEALTH_ENTRY_KEY);
}

function maybeShowLevelUpToast(summary) {
    const totalPoints = toSafeNumber(summary?.points?.total_points);
    const level = toSafeNumber(summary?.points?.level, 1, 1);
    const previousPointsRaw = localStorage.getItem(LAST_POINTS_SEEN_KEY);
    const previousPoints = Number(previousPointsRaw);

    if (Number.isFinite(previousPoints) && totalPoints > previousPoints) {
        const previousLevel = Math.floor(previousPoints / 100) + 1;
        if (level > previousLevel) {
            showAchievementToast('Level Up', `You reached Level ${level}. Keep the momentum going.`, 'success');
        }
    }

    localStorage.setItem(LAST_POINTS_SEEN_KEY, String(totalPoints));
}

function showAchievementToast(title, message, variant = 'info') {
    const container = document.getElementById('achievementToastContainer');
    if (!container) {
        return;
    }

    const toastElement = document.createElement('div');
    toastElement.className = 'toast achievements-toast';
    toastElement.role = 'status';
    toastElement.ariaLive = 'polite';
    toastElement.ariaAtomic = 'true';

    const iconClass = variant === 'success' ? 'bi-trophy-fill text-success' : 'bi-stars text-primary';
    toastElement.innerHTML = `
        <div class="toast-header">
            <i class="bi ${iconClass} me-2"></i>
            <strong class="me-auto">${escapeHtml(title)}</strong>
            <small class="text-muted">just now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${escapeHtml(message)}</div>
    `;

    container.appendChild(toastElement);

    if (window.bootstrap && typeof window.bootstrap.Toast === 'function') {
        const toast = new window.bootstrap.Toast(toastElement, {
            delay: 6000,
            autohide: true
        });

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });

        toast.show();
    } else {
        setTimeout(() => {
            toastElement.remove();
        }, 6000);
    }
}

function getBadgeArtDataUri(badgeId, fallbackSymbol = '🏅') {
    if (BADGE_ART_CACHE[badgeId]) {
        return BADGE_ART_CACHE[badgeId];
    }

    const theme = BADGE_ART_THEMES[badgeId] || BADGE_ART_THEMES.default;
    const symbol = escapeSvgText(theme.symbol || fallbackSymbol || '🏅');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="badge icon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.start}" />
      <stop offset="100%" stop-color="${theme.end}" />
    </linearGradient>
    <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <path d="M110 8L190 50V170L110 212L30 170V50Z" fill="url(#bg)" />
  <path d="M110 13L185 53V167L110 207L35 167V53Z" fill="none" stroke="${theme.rim}" stroke-width="6" stroke-linejoin="round" />
  <circle cx="110" cy="110" r="65" fill="url(#core)" />
  <circle cx="110" cy="110" r="56" fill="#ffffff" fill-opacity="0.35" />
  <circle cx="78" cy="74" r="10" fill="#ffffff" fill-opacity="0.45" />
  <text x="110" y="128" text-anchor="middle" font-size="66" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${symbol}</text>
</svg>
    `.trim();

    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    BADGE_ART_CACHE[badgeId] = uri;
    return uri;
}

function escapeSvgText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatProgressValue(criteria, value) {
    if (criteria.type === 'metric_peak' && criteria.metric === 'sleep_hours') {
        return Number(value).toFixed(1).replace(/\.0$/, '');
    }

    return Math.round(Number(value)).toLocaleString();
}

function toSafeNumber(value, fallback = 0, minimum = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }
    return Math.max(minimum, numeric);
}

function clamp(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}

function setPieProgress(elementId, percent, labelId = null) {
    const safePercent = Math.round(clamp(percent, 0, 100));
    const element = document.getElementById(elementId);
    if (element) {
        element.style.setProperty('--progress', `${safePercent}%`);
    }

    if (labelId) {
        setText(labelId, `${safePercent}%`);
    }
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatDateLabel(value, prefix) {
    if (!value) {
        return `${prefix} recently`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return `${prefix} recently`;
    }

    return `${prefix} ${parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })}`;
}

function formatJoinedLabel(value) {
    if (!value) {
        return 'Building your health streak';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Building your health streak';
    }

    return `Playing since ${parsed.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    })}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
