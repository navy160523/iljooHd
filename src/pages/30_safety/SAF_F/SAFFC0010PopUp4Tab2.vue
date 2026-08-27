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
    { fieldName: 'PASS', dataType: 'text', header: { text: t('합격') } },
    { fieldName: 'FAILURE', dataType: 'text', header: { text: t('불합격') } },
    { fieldName: 'ORGN_NM', dataType: 'text', header: { text: t('소속') } },
    { fieldName: 'ORI_ORGN_NM', dataType: 'text', header: { text: t('신청당시소속') } },
    { fieldName: 'TARGET_ID', dataType: 'text', header: { text: t('사용자 아이디') } },
    { fieldName: 'TARGET_NM', dataType: 'text', header: { text: t('이름') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'EDU_SCORE', dataType: 'text', header: { text: t('점수') } },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고(사유기재)') } },
    { fieldName: 'HND_PHN', dataType: 'text', header: { text: t('핸드폰 번호') } }
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields


//  이벤트 시작



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
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: 26vh;
}

</style>
