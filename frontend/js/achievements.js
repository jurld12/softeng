let achievementsPageSummary = null;

function checkAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }

    if (role !== 'patient') {
        alert('Access denied. This page is for patients only.');
        window.location.href = 'login-v2.html';
        return false;
    }

    return true;
}

window.logout = async function() {
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

    await loadCurrentUser();
    await loadGamificationSummary();
    await loadAchievements();
}

async function loadCurrentUser() {
    try {
        const response = await fetch(getApiUrl('/auth/me'), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return;
        }

        const user = await response.json();
        const userName = user?.name || 'User';

        const nameEl = document.getElementById('sidebarUserName');
        const emailEl = document.getElementById('sidebarUserEmail');
        if (nameEl) nameEl.textContent = userName;
        if (emailEl) emailEl.textContent = user?.email || '';

        const avatars = document.querySelectorAll('img[alt="Profile"]');
        avatars.forEach((avatar) => {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff`;
        });
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
            throw new Error('Failed to load gamification summary');
        }

        const summary = await response.json();
        achievementsPageSummary = summary;
        renderSummary(summary);
        renderBadges(summary?.badges || []);
    } catch (error) {
        console.error('Error loading gamification summary:', error);
        renderSummary(null);
        renderBadges([], true);
    }
}

async function loadAchievements() {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_ACHIEVEMENTS || '/patients/me/achievements';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load achievements');
        }

        const achievements = await response.json();
        const list = Array.isArray(achievements) ? achievements : [];

        if (list.length) {
            renderAchievements(list);
            return;
        }

        const fallback = deriveFromBadges(achievementsPageSummary?.badges || []);
        renderAchievements(fallback, { derived: true });
    } catch (error) {
        console.error('Error loading achievements:', error);
        const fallback = deriveFromBadges(achievementsPageSummary?.badges || []);
        if (fallback.length) {
            renderAchievements(fallback, { derived: true });
            return;
        }
        renderAchievements([], { error: true });
    }
}

function renderSummary(summary) {
    const points = summary?.points || {};
    const totalPoints = Number.isFinite(Number(points.total_points)) ? Number(points.total_points) : 0;
    const level = Number.isFinite(Number(points.level)) && Number(points.level) > 0 ? Number(points.level) : 1;
    const rank = Number.isFinite(Number(points.rank)) && Number(points.rank) > 0 ? `#${Number(points.rank)}` : '-';
    const streak = Number.isFinite(Number(summary?.current_streak)) && Number(summary?.current_streak) >= 0
        ? Number(summary.current_streak)
        : 0;
    const badgesEarned = Number.isFinite(Number(summary?.badges_earned)) ? Number(summary.badges_earned) : 0;
    const totalBadges = Number.isFinite(Number(summary?.total_badges_available)) ? Number(summary.total_badges_available) : 0;

    setText('achievementsPointsValue', totalPoints.toLocaleString());
    setText('achievementsLevelValue', String(level));
    setText('achievementsRankValue', rank);
    setText('achievementsStreakValue', `${streak} day${streak === 1 ? '' : 's'}`);
    setText('achievementsBadgeProgress', `${badgesEarned} / ${totalBadges} badges`);
}

function renderBadges(badges, isError = false) {
    const container = document.getElementById('achievementBadgesGrid');
    if (!container) {
        return;
    }

    if (isError) {
        container.innerHTML = '<div class="gamification-empty">Unable to load badges right now.</div>';
        return;
    }

    const list = Array.isArray(badges) ? badges.slice(0, 12) : [];
    if (!list.length) {
        container.innerHTML = '<div class="gamification-empty">No badges unlocked yet. Start logging health data to earn your first badge.</div>';
        return;
    }

    container.innerHTML = list.map((badge) => {
        const icon = escapeHtml(String(badge?.icon || '🏅'));
        const name = escapeHtml(String(badge?.name || 'Badge'));
        const dateLabel = escapeHtml(formatDateLabel(badge?.date_awarded, 'Earned'));

        return `
            <article class="gamification-badge">
                <div class="gamification-badge__icon">${icon}</div>
                <div>
                    <div class="gamification-badge__title">${name}</div>
                    <div class="gamification-badge__date">${dateLabel}</div>
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
                <div class="gamification-achievement__title">${title}</div>
                <div class="gamification-achievement__description">${description}</div>
                <div class="gamification-achievement__meta">
                    <span>${dateLabel}</span>
                    <span class="gamification-achievement__points">${escapeHtml(pointsLabel)}</span>
                </div>
            </article>
        `;
    }).join('');
}

function deriveFromBadges(badges) {
    if (!Array.isArray(badges) || !badges.length) {
        return [];
    }

    return badges.slice(0, 12).map((badge) => ({
        title: `Badge unlocked: ${badge?.name || 'Achievement'}`,
        description: badge?.description || 'Unlocked through your health tracking progress.',
        points: null,
        date_awarded: badge?.date_awarded || null
    }));
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
