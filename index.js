/* ==========================================================================
   LPU Nexus — interactions
   ========================================================================== */
(function () {
    'use strict';

    var root = document.documentElement;

    /* ---------------- theme ---------------- */
    try {
        var saved = localStorage.getItem('lpu-nexus-theme');
        if (saved) root.setAttribute('data-theme', saved);
    } catch (e) { /* storage unavailable */ }

    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('lpu-nexus-theme', next); } catch (e) { /* ignore */ }
        });
    }

    /* ---------------- mobile nav ---------------- */
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () { navLinks.classList.toggle('open'); });
        navLinks.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') navLinks.classList.remove('open');
        });
    }

    /* ---------------- condensed navbar on scroll ---------------- */
    var nav = document.querySelector('.nav');
    if (nav) {
        var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------------- scroll reveal ---------------- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var motionOK = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealAll() {
        reveals.forEach(function (el) { el.classList.remove('pre'); el.classList.add('in'); });
    }

    if (window.IntersectionObserver && reveals.length && motionOK) {
        reveals.forEach(function (el) { el.classList.add('pre'); });
        var ro = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.remove('pre');
                en.target.classList.add('in');
                obs.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.02 });
        reveals.forEach(function (el) { ro.observe(el); });
        /* safety net: never leave anything stuck invisible */
        window.setTimeout(revealAll, 2500);
    } else {
        revealAll();
    }

    /* ---------------- active nav link on scroll ---------------- */
    var linkFor = {};
    Array.prototype.forEach.call(navLinks ? navLinks.querySelectorAll('a') : [], function (a) {
        linkFor[a.getAttribute('href').slice(1)] = a;
    });
    var watched = ['top', 'services', 'food', 'tools']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);

    if (window.IntersectionObserver && watched.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                Object.keys(linkFor).forEach(function (k) { linkFor[k].classList.remove('active'); });
                if (linkFor[en.target.id]) linkFor[en.target.id].classList.add('active');
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        watched.forEach(function (s) { io.observe(s); });
    }

    /* ---------------- search ---------------- */
    var groups = Array.prototype.map.call(
        document.querySelectorAll('[data-searchgroup]'),
        function (g) {
            var section = g.closest('.section');
            var empty = document.createElement('p');
            empty.className = 'no-results';
            empty.hidden = true;
            empty.textContent = 'No matches in this section.';
            g.parentNode.insertBefore(empty, g.nextSibling);
            return {
                el: g,
                section: section,
                empty: empty,
                items: Array.prototype.slice.call(g.querySelectorAll('[data-search]'))
            };
        }
    );

    function applySearch(raw) {
        var q = (raw || '').trim().toLowerCase();
        groups.forEach(function (g) {
            var shown = 0;
            g.items.forEach(function (item) {
                var hay = (item.getAttribute('data-search') + ' ' + item.textContent).toLowerCase();
                var hit = !q || hay.indexOf(q) !== -1;
                item.classList.toggle('is-hidden', !hit);
                if (hit) shown++;
            });
            g.empty.hidden = !q || shown > 0;
            if (g.section) g.section.classList.toggle('is-hidden', !!q && shown === 0);
        });
    }

    var navSearch = document.getElementById('navSearch');
    var heroSearch = document.getElementById('heroSearch');

    function wireSearch(input, other) {
        if (!input) return;
        input.addEventListener('input', function () {
            if (other && other.value !== input.value) other.value = input.value;
            applySearch(input.value);
        });
    }
    wireSearch(navSearch, heroSearch);
    wireSearch(heroSearch, navSearch);

    var heroForm = document.getElementById('heroSearchForm');
    if (heroForm) {
        heroForm.addEventListener('submit', function (e) {
            e.preventDefault();
            applySearch(heroSearch ? heroSearch.value : '');
            var first = document.querySelector('[data-searchgroup] [data-search]:not(.is-hidden)');
            var target = first ? first.closest('.section') : document.getElementById('quick');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    document.addEventListener('keydown', function (e) {
        var t = e.target;
        var typing = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
        if (e.key === '/' && !typing) {
            e.preventDefault();
            /* focus whichever search input is actually on screen */
            var visible = (navSearch && navSearch.offsetParent !== null) ? navSearch : heroSearch;
            if (visible) visible.focus();
        } else if (e.key === 'Escape' && typing && t.type === 'search') {
            t.value = '';
            if (navSearch) navSearch.value = '';
            if (heroSearch) heroSearch.value = '';
            applySearch('');
            t.blur();
        }
    });

    /* ---------------- tool panels ---------------- */
    function togglePanel(id) {
        var panel = document.getElementById(id);
        if (!panel) return;
        panel.hidden = !panel.hidden;
        if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    var openCgpa = document.getElementById('openCgpa');
    var openGrade = document.getElementById('openGrade');
    if (openCgpa) openCgpa.addEventListener('click', function () { togglePanel('cgpaPanel'); });
    if (openGrade) openGrade.addEventListener('click', function () { togglePanel('gradePanel'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
        b.addEventListener('click', function () {
            document.getElementById(b.getAttribute('data-close')).hidden = true;
        });
    });

    /* ---------------- grade scale (LPU 10-point) ---------------- */
    var GRADES = [
        { label: 'O  (10)', value: 10 },
        { label: 'A+ (9)', value: 9 },
        { label: 'A  (8)', value: 8 },
        { label: 'B+ (7)', value: 7 },
        { label: 'B  (6)', value: 6 },
        { label: 'C  (5)', value: 5 },
        { label: 'D  (4)', value: 4 },
        { label: 'E  (3)', value: 3 },
        { label: 'F  (0)', value: 0 }
    ];

    function gradeOptions(selected) {
        return GRADES.map(function (g) {
            return '<option value="' + g.value + '"' +
                (g.value === selected ? ' selected' : '') + '>' + g.label + '</option>';
        }).join('');
    }

    /* ---------------- CGPA calculator ---------------- */
    var rowsBox = document.getElementById('courseRows');

    function addRow(name, credits) {
        if (!rowsBox) return;
        var row = document.createElement('div');
        row.className = 'course-row';
        row.innerHTML =
            '<input type="text" class="c-name" placeholder="Course name (optional)">' +
            '<input type="number" class="c-credits" min="0" step="0.5" placeholder="Credits">' +
            '<select class="c-grade">' + gradeOptions(8) + '</select>' +
            '<button type="button" class="row-del" aria-label="Remove course">&times;</button>';
        row.querySelector('.c-name').value = name || '';
        if (credits != null) row.querySelector('.c-credits').value = credits;
        row.querySelector('.row-del').addEventListener('click', function () {
            row.remove();
            if (!rowsBox.children.length) addRow();
        });
        rowsBox.appendChild(row);
    }

    function fmt(n) { return (Math.round(n * 100) / 100).toFixed(2); }

    var ring = document.getElementById('sgpaRing');
    function setRing(sgpa) {
        if (!ring) return;
        var pct = sgpa == null ? 0 : Math.max(0, Math.min(100, sgpa * 10));
        ring.style.setProperty('--val', pct);
    }

    function calculate() {
        var err = document.getElementById('calcErr');
        err.textContent = '';

        var points = 0, credits = 0, invalid = false;
        Array.prototype.forEach.call(rowsBox.querySelectorAll('.course-row'), function (row) {
            var cRaw = row.querySelector('.c-credits').value.trim();
            if (cRaw === '') return;
            var c = parseFloat(cRaw);
            var g = parseFloat(row.querySelector('.c-grade').value);
            if (isNaN(c) || c < 0) { invalid = true; return; }
            credits += c;
            points += c * g;
        });

        if (invalid) { err.textContent = 'Some credit values are not valid numbers.'; }
        if (credits <= 0) {
            err.textContent = err.textContent || 'Enter credits for at least one course.';
            document.getElementById('outSgpa').textContent = '–';
            document.getElementById('outCredits').textContent = '–';
            document.getElementById('outCgpa').textContent = '–';
            document.getElementById('outTotal').textContent = '–';
            setRing(null);
            return;
        }

        var sgpa = points / credits;
        setRing(sgpa);
        document.getElementById('outSgpa').textContent = fmt(sgpa);
        document.getElementById('outCredits').textContent = fmt(credits);

        var pc = parseFloat(document.getElementById('prevCgpa').value);
        var pcr = parseFloat(document.getElementById('prevCredits').value);
        var hasPrev = !isNaN(pc) && !isNaN(pcr) && pcr > 0;

        if (hasPrev) {
            if (pc < 0 || pc > 10) {
                err.textContent = 'Previous CGPA must be between 0 and 10.';
                document.getElementById('outCgpa').textContent = '–';
                document.getElementById('outTotal').textContent = '–';
                return;
            }
            var total = pcr + credits;
            document.getElementById('outCgpa').textContent = fmt((pc * pcr + points) / total);
            document.getElementById('outTotal').textContent = fmt(total);
        } else {
            document.getElementById('outCgpa').textContent = fmt(sgpa);
            document.getElementById('outTotal').textContent = fmt(credits);
        }
    }

    if (rowsBox) {
        addRow(); addRow(); addRow();
        document.getElementById('addRow').addEventListener('click', function () { addRow(); });
        document.getElementById('calcBtn').addEventListener('click', calculate);
        document.getElementById('resetCalc').addEventListener('click', function () {
            rowsBox.innerHTML = '';
            addRow(); addRow(); addRow();
            document.getElementById('prevCgpa').value = '';
            document.getElementById('prevCredits').value = '';
            document.getElementById('calcErr').textContent = '';
            ['outSgpa', 'outCredits', 'outCgpa', 'outTotal'].forEach(function (id) {
                document.getElementById(id).textContent = '–';
            });
            setRing(null);
        });
        rowsBox.addEventListener('input', calculate);
        rowsBox.addEventListener('change', calculate);
        document.getElementById('prevCgpa').addEventListener('input', calculate);
        document.getElementById('prevCredits').addEventListener('input', calculate);
    }

    /* ---------------- grade converter ---------------- */
    var gcGrade = document.getElementById('gcGrade');
    var gcPoint = document.getElementById('gcPoint');
    if (gcGrade && gcPoint) {
        gcGrade.innerHTML = gradeOptions(8);

        function showConversion(p) {
            var ok = !isNaN(p) && p >= 0 && p <= 10;
            document.getElementById('gcOutPoint').textContent = ok ? fmt(p) : '–';
            document.getElementById('gcOutPct').textContent = ok ? fmt(p * 10) : '–';
        }
        gcGrade.addEventListener('change', function () {
            gcPoint.value = gcGrade.value;
            showConversion(parseFloat(gcGrade.value));
        });
        gcPoint.addEventListener('input', function () {
            showConversion(parseFloat(gcPoint.value));
        });
        gcPoint.value = gcGrade.value;
        showConversion(parseFloat(gcGrade.value));
    }
})();
