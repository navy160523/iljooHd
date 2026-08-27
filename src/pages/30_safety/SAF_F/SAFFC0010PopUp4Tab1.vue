<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'

import { useUserStore } from '@hiway/stores/user'


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }},
  keys : [''],
  fields : [ 
    { fieldName: 'ATTEND', dataType: 'text', header: { text: t('참석') } },
    { fieldName: 'NON_YN', dataType: 'text', header: { text: t('제외') } },
    { fieldName: 'NON_ATTEND', dataType: 'text', header: { text: t('불참') } },
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('소속') } },
    { fieldName: 'ORI_ORGN_NM', dataType: 'text', header: { text: t('신청당시소속') } },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 아이디') } },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') } },
    { fieldName: 'TXT', dataType: 'text', header: { text: t('당일근태') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(사유기재)') } },
    { fieldName: 'CONFIRM_SIGN_YN', dataType: 'text', header: { text: t('전자서명') } },
    { fieldName: 'ATTEND_TIME', dataType: 'text', header: { text: t('출석확인') } },
    { fieldName: 'EDU_CNFM_USER_NM', dataType: 'text', header: { text: t('교육확인자') } },
    { fieldName: 'ADD_EDU_DATE', dataType: 'text', header: { text: t('추가교육일') } },
    { fieldName: 'ADD_EDU_CNFM_USER_NM', dataType: 'text', header: { text: t('추가교육확인자') } },
    { fieldName: 'CONFIRM_DIV', dataType: 'text', header: { text: t('대상자변경이수') } },

  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields




</script>

<template>

          <RealGrid
            ref="grdMain"
            style="height: 693px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
 
</template>
