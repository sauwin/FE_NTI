import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/features/auth/stores/auth';
import { createApplicationWithDocuments } from '@/features/applications/api/applications';
import { getCallById } from '@/shared/api/calls';
import { getTeams } from '@/features/student/api/teams';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const urlId = computed(() => {
    const idParam = route.params.callId || route.params.id || route.query.id;
    return idParam ? Number(idParam) : null;
});
const resolvedCallId = ref(null);
const currentCall = ref(null);
const requiredDocuments = ref([]);
const myTeams = ref([]);
const selectedTeamId = ref(null);
const applicantType = ref('team');
const error = ref('');
const fieldErrors = ref({});
const loading = ref(false);
const step = ref(1);
const projectTitle = ref('');
const proposedSolution = ref('');
const files = ref({});
// Bind fallback labels directly to localization keys
const defaultDocLabels = computed(() => ({
    cv: t('programB.upload.defaultLabels.cv'),
    motivation_letter: t('programB.upload.defaultLabels.motivation_letter'),
    technical_proposal: t('programB.upload.defaultLabels.technical_proposal'),
}));
function documentKey(doc) {
    const raw = typeof doc === 'string' ? doc : doc.type || doc.document_name || '';
    return String(raw).toLowerCase().replace(/\s+/g, '_');
}
function normalizeRequiredDocuments(raw) {
    if (!raw) {
        return [];
    }
    const docs = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(docs)) {
        return [];
    }
    return docs.map((item) => {
        if (!item) {
            return {
                document_name: t('programB.upload.defaultLabels.genericDoc', { key: 'document' }),
                is_mandatory: true,
                max_size_mb: 10,
                type: 'document',
            };
        }
        if (typeof item === 'string') {
            return {
                document_name: item.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
                is_mandatory: true,
                max_size_mb: 10,
                type: documentKey(item),
            };
        }
        const name = item.document_name || item.name || item.label || String(item.type || item.slug || item.key || 'document');
        const key = String(item.type || item.slug || item.key || item.document_name || item.name || name);
        return {
            document_name: name,
            is_mandatory: item.is_mandatory ?? true,
            max_size_mb: item.max_size_mb ?? 10,
            type: documentKey(key),
        };
    });
}
function getDocumentRequirements() {
    if (requiredDocuments.value.length > 0) {
        return requiredDocuments.value;
    }
    return Object.keys(docLabels.value).map((key) => ({
        document_name: docLabels.value[key],
        type: key,
        is_mandatory: true,
        max_size_mb: 10,
    }));
}
const docLabels = computed(() => {
    if (requiredDocuments.value.length > 0) {
        return requiredDocuments.value.reduce((labels, doc) => {
            labels[documentKey(doc)] = doc.document_name || defaultDocLabels.value[documentKey(doc)] || t('programB.upload.defaultLabels.fallbackDoc', { key: documentKey(doc) });
            return labels;
        }, {});
    }
    return defaultDocLabels.value;
});
watch(docLabels, (newLabels) => {
    const newFilesState = {};
    Object.keys(newLabels).forEach((key) => {
        newFilesState[key] = files.value[key] || null;
    });
    files.value = newFilesState;
}, { immediate: true });
onMounted(async () => {
    if (!auth.isLoggedIn) {
        router.push('/auth/login');
        return;
    }
    if (!urlId.value || isNaN(urlId.value)) {
        error.value = t('programB.upload.errors.criticalUrlError');
        return;
    }
    loading.value = true;
    try {
        const teamsRes = await getTeams();
        myTeams.value = Array.isArray(teamsRes.data) ? teamsRes.data : [];
        if (myTeams.value[0]) {
            selectedTeamId.value = myTeams.value[0].id;
        }
    }
    catch (err) {
        console.error('Unable to load student teams:', err);
    }
    try {
        const callRes = await getCallById(urlId.value);
        currentCall.value = callRes.data;
        resolvedCallId.value = callRes.data.id;
        requiredDocuments.value = normalizeRequiredDocuments(callRes.data.required_documents);
        if (requiredDocuments.value.length === 0 && callRes.data.required_documents) {
            console.warn('Program B call returned required_documents but normalization failed:', callRes.data.required_documents);
        }
        if (callRes.data && callRes.data.task) {
            projectTitle.value = callRes.data.task.title || '';
        }
    }
    catch (err) {
        console.error('Error loading call details:', err);
        error.value = t('programB.upload.errors.loadDetailsError');
    }
    finally {
        loading.value = false;
    }
});
function onFileChange(type, event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        files.value[type] = input.files[0];
    }
}
function nextStep() {
    error.value = '';
    if (applicantType.value == 'team' && !selectedTeamId.value) {
        error.value = t('programB.upload.errors.selectTeam');
        return;
    }
    if (!projectTitle.value.trim()) {
        error.value = t('programB.upload.errors.projectName');
        return;
    }
    if (!proposedSolution.value.trim()) {
        error.value = t('programB.upload.errors.solutionConcept');
        return;
    }
    step.value = 2;
}
async function submit() {
    if (!resolvedCallId.value) {
        error.value = t('programB.upload.errors.noCallId');
        return;
    }
    error.value = '';
    fieldErrors.value = {};
    loading.value = true;
    const requiredDocs = getDocumentRequirements();
    for (const doc of requiredDocs) {
        const key = documentKey(doc);
        if (doc.is_mandatory && !files.value[key]) {
            error.value = t('programB.upload.errors.missingDoc', { name: doc.document_name });
            loading.value = false;
            return;
        }
    }
    try {
        const payload = {
            applicant_type: applicantType.value,
            program_type: 'b',
            call_id: resolvedCallId.value,
            team_id: applicantType.value == 'team' ? selectedTeamId.value : null,
            project_title: projectTitle.value,
            proposed_solution: proposedSolution.value,
        };
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, String(value));
            }
        });
        requiredDocs.forEach((doc, index) => {
            const key = documentKey(doc);
            const file = files.value[key];
            if (!file) {
                return;
            }
            formData.append(`documents[${index}][type]`, doc.type || key);
            formData.append(`documents[${index}][classification]`, 'confidential');
            formData.append(`documents[${index}][file]`, file);
        });
        await createApplicationWithDocuments(formData);
        step.value = 3;
    }
    catch (e) {
        fieldErrors.value = e.response?.data?.errors ?? {};
        error.value = e?.response?.data?.message || t('programB.upload.errors.genericError');
    }
    finally {
        loading.value = false;
    }
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300" },
});
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-300']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative overflow-hidden backdrop-blur-md" },
});
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-900/40']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "text-center py-10 text-sm text-slate-400" },
    });
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-10']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
    (__VLS_ctx.t('programB.upload.submittingApp'));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    if (__VLS_ctx.currentCall?.task && __VLS_ctx.step !== 3) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mb-6 p-4 bg-blue-950/40 border border-blue-900/60 rounded-xl" },
        });
        /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-950/40']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-blue-900/60']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1" },
        });
        /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        (__VLS_ctx.t('programB.upload.applyingFor'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.h4, __VLS_intrinsics.h4)({
            ...{ class: "text-base font-bold text-white leading-tight" },
        });
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
        (__VLS_ctx.currentCall.task.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-400 mt-1" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
        (__VLS_ctx.t('programB.upload.partner'));
        (__VLS_ctx.currentCall.task.organization?.name || 'Program partner');
    }
    if (__VLS_ctx.step === 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-2xl font-bold text-white mb-1" },
        });
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        (__VLS_ctx.t('programB.upload.step1Title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500 mb-6" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
        (__VLS_ctx.t('programB.upload.step1Sub'));
        if (__VLS_ctx.error) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-950/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-red-900/50']} */ ;
            (__VLS_ctx.error);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-5" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-5']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-xs text-gray-400 font-semibold uppercase mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.t('programB.upload.form.applicantType'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
            value: (__VLS_ctx.applicantType),
            ...{ class: "w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: "student",
            value: "student",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
            key: "team",
            value: "team",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalDirective(__VLS_directives.vShow, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.applicantType == 'team') }, null, null);
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-xs text-gray-400 font-semibold uppercase mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.t('programB.upload.form.chooseTeam'));
        if (__VLS_ctx.myTeams.length === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "p-3 border border-dashed border-amber-900/60 bg-amber-950/20 rounded-lg text-xs text-amber-400" },
            });
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-amber-900/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-amber-950/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-amber-400']} */ ;
            let __VLS_0;
            /** @ts-ignore @type {typeof __VLS_components.i18nT | typeof __VLS_components.I18nT | typeof __VLS_components.i18nT | typeof __VLS_components.I18nT} */
            i18nT;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
                keypath: "programB.upload.form.noTeamsWarning",
                scope: "global",
            }));
            const __VLS_2 = __VLS_1({
                keypath: "programB.upload.form.noTeamsWarning",
                scope: "global",
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            const { default: __VLS_5 } = __VLS_3.slots;
            {
                const { link: __VLS_6 } = __VLS_3.slots;
                let __VLS_7;
                /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
                routerLink;
                // @ts-ignore
                const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
                    to: "/teams/create",
                    ...{ class: "underline font-bold hover:text-amber-300" },
                }));
                const __VLS_9 = __VLS_8({
                    to: "/teams/create",
                    ...{ class: "underline font-bold hover:text-amber-300" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_8));
                /** @type {__VLS_StyleScopedClasses['underline']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-amber-300']} */ ;
                const { default: __VLS_12 } = __VLS_10.slots;
                (__VLS_ctx.t('programB.upload.form.createOne'));
                // @ts-ignore
                [loading, t, t, t, t, t, t, t, t, currentCall, currentCall, currentCall, step, step, error, error, applicantType, applicantType, myTeams,];
                var __VLS_10;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
            var __VLS_3;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.selectedTeamId),
                ...{ class: "w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer" },
            });
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:border-blue-600']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            for (const [team] of __VLS_vFor((__VLS_ctx.myTeams))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
                    key: (team.id),
                    value: (team.id),
                });
                (team.name);
                (team.status);
                // @ts-ignore
                [myTeams, selectedTeamId,];
            }
        }
        if (__VLS_ctx.fieldErrors.team_id?.[0]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-red-400 text-xs mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.fieldErrors.team_id[0]);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-xs text-gray-400 font-semibold uppercase mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.t('programB.upload.form.projectNameLabel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            value: (__VLS_ctx.projectTitle),
            type: "text",
            ...{ class: "w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (__VLS_ctx.fieldErrors.project_title?.[0]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-red-400 text-xs mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.fieldErrors.project_title[0]);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
            ...{ class: "block text-xs text-gray-400 font-semibold uppercase mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['block']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.t('programB.upload.form.solutionOutlineLabel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            value: (__VLS_ctx.proposedSolution),
            rows: "5",
            placeholder: (__VLS_ctx.t('programB.upload.form.solutionPlaceholder')),
            ...{ class: "w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white resize-none focus:border-blue-600 transition outline-none text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-slate-950']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['resize-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:border-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        if (__VLS_ctx.fieldErrors.proposed_solution?.[0]) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-red-400 text-xs mt-1" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            (__VLS_ctx.fieldErrors.proposed_solution[0]);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-3 mt-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.step === 1))
                        return;
                    __VLS_ctx.router.back();
                    // @ts-ignore
                    [t, t, t, fieldErrors, fieldErrors, fieldErrors, fieldErrors, fieldErrors, fieldErrors, projectTitle, proposedSolution, router,];
                } },
            ...{ class: "w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_ctx.t('programB.upload.form.cancel'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.nextStep) },
            disabled: (__VLS_ctx.applicantType == 'team' && __VLS_ctx.myTeams.length === 0),
            ...{ class: "flex-1 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:bg-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:text-slate-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        (__VLS_ctx.t('programB.upload.form.nextDoc'));
    }
    else if (__VLS_ctx.step === 2) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-2xl font-bold text-white mb-1" },
        });
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
        (__VLS_ctx.t('programB.upload.step2Title'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-xs text-slate-500 mb-6" },
        });
        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
        (__VLS_ctx.t('programB.upload.step2Sub'));
        if (__VLS_ctx.error) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50" },
            });
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-red-950/60']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-red-900/50']} */ ;
            (__VLS_ctx.error);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        for (const [label, key] of __VLS_vFor((__VLS_ctx.docLabels))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (key),
                ...{ class: "border border-slate-950 p-4 rounded-xl bg-slate-950/60" },
            });
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-slate-950']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-slate-950/60']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
                ...{ class: "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2" },
            });
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            (label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.step === 1))
                            return;
                        if (!(__VLS_ctx.step === 2))
                            return;
                        __VLS_ctx.onFileChange(String(key), $event);
                        // @ts-ignore
                        [t, t, t, t, step, error, error, applicantType, myTeams, nextStep, docLabels, onFileChange,];
                    } },
                type: "file",
                accept: ".pdf,.doc,.docx,.ppt,.pptx",
                ...{ class: "text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 file:cursor-pointer transition" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:mr-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:rounded-lg']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:border-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:bg-blue-950']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:text-blue-400']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:file:bg-blue-900']} */ ;
            /** @type {__VLS_StyleScopedClasses['file:cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            if (__VLS_ctx.files[key]) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "text-xs text-green-400 mt-2 font-medium" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-green-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
                (__VLS_ctx.t('programB.upload.form.selectedFile', { name: __VLS_ctx.files[key]?.name }));
            }
            // @ts-ignore
            [t, files, files,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-4 mt-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.step === 1))
                        return;
                    if (!(__VLS_ctx.step === 2))
                        return;
                    __VLS_ctx.step = 1;
                    // @ts-ignore
                    [step,];
                } },
            ...{ class: "w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium" },
        });
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-slate-800']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        (__VLS_ctx.t('programB.upload.form.back'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.submit) },
            disabled: (__VLS_ctx.loading),
            ...{ class: "flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-blue-950']} */ ;
        (__VLS_ctx.t('programB.upload.form.submitFinal'));
    }
    if (__VLS_ctx.step === 3) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-center py-6" },
        });
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "text-5xl mb-4" },
        });
        /** @type {__VLS_StyleScopedClasses['text-5xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "text-2xl font-bold text-white mb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
        (__VLS_ctx.t('programB.upload.successTitle'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-gray-400 text-sm mb-6 max-w-sm mx-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
        (__VLS_ctx.t('programB.upload.successSub'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.step === 3))
                        return;
                    __VLS_ctx.router.push('/programs/b');
                    // @ts-ignore
                    [loading, t, t, t, t, step, router, submit,];
                } },
            ...{ class: "bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition" },
        });
        /** @type {__VLS_StyleScopedClasses['bg-blue-600']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-blue-700']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        (__VLS_ctx.t('programB.upload.backCatalog'));
    }
}
// @ts-ignore
[t,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
