<!-- SAFGA0010 안전 PASSPORT Tab7(단기공사)-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import img1 from '@images/pages/pose-fs-9.png'
import { useUserStore } from '@hiway/stores/user'


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const grdMain = ref(null)

const props = defineProps({
  IntData: {
    type: Array,
    required: false,
    default() {
      return [];
    },
  },
});

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }},
  keys : [''],
  fields : [ 
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('의뢰부서') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('의로자') } },
    { fieldName: 'VND_NAME', dataType: 'text', header: { text: t('업체명') } },
    { fieldName: 'WORK_DESC', dataType: 'text', header: { text: t('공사명') } },
    { fieldName: 'WORK_DT',header: { text: t('공사기간') } ,
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,},
    { fieldName: 'WORK_AREA', dataType: 'text', header: { text: t('공사장소') } },
    { fieldName: 'GATE_NM', dataType: 'text', header: { text: t('출입문') } },
    { fieldName: 'WORK_NO', dataType: 'text', header: { text: t('공사번호') } }
  ],
  columns : [],
 
})

grdMainProps.columns = grdMainProps.fields


//  이벤트 시작

onMounted(()=>{
  if(props.IntData[0]){
    grdMain.value.getDataProvider().setRows(props.IntData);
  }
  else{
    grdMain.value.getDataProvider().setRows(null);
  }
})


</script>

<template>
  <v-card class="pa-0 fill-height">
      <div class="content-area">

        <v-sheet height="100%" class="mb-3">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: 26vh;
}

</style>
