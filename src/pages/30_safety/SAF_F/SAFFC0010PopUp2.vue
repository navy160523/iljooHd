
<script setup>
import { ref, reactive, onMounted, watch ,getCurrentInstance} from 'vue'
import { commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList , commonUploadFilesApi ,commonSendSMS} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import queryFlowHelper from "@/utils/searchFlowHelper"
import SAFFC0010PopUp from '@/pages/30_safety/SAF_F/SAFFC0010PopUp3.vue'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const dialog = ref(false)
const grdMain = ref(null)
const searchData = ref({})
const DivGubun = ref('')
const radioV = ref('Y')
const Gijn = ref('')
const popup = ref(null)
const openPopup = (param , e)=>{
  console.log(param , e )
  searchData.value =''
  DivGubun.value = ''
  dialog.value = true
  radioV.value ='Y'
  DivGubun.value = e
  searchData.value =param
  busa()
}

const close =()=>{
  dialog.value = false
}

const busa =()=>{
  commonSearchApi({ queryId: "searchDept3",param: { CMPNY_DIV: searchData.value.CMPNY_DIV,BSNS_CD: searchData.value.BSNS_CD }})
  .then((res)=>{
    console.log(res.ORESULT_CUR,'res')
    console.log(searchData.value.DEPT_CD,'searchData.value.DEPT_CD')
   let busu =  res.ORESULT_CUR.filter((x)=>x.DEPT_CD === searchData.value.DEPT_CD)
   Gijn.value = `${busu[0].DEPT_NM} ${dayjs().format('YYYY-MM-DD')} 기준`
  })
}



// 그리드
const grd1Props = reactive({
  gridViewOption : {edit: { editable:false }},
  keys : ['APPLY_DATE2','APPLY_EMP_NM','APPLY_CNT'],
  fields : [ 
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') } },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'KOR_NM', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') } },
    { fieldName: 'P_A', dataType: 'text', header: { text: t('영상안전교육계획(분)') } },
    { fieldName: 'R_A', dataType: 'text', header: { text: t('영상안전교육이수(분)') } },
    { fieldName: 'P_B', dataType: 'text', header: { text: t('현장안전교육계획(분)') } },
    { fieldName: 'R_B', dataType: 'text', header: { text: t('현장안전교육이수(분)') } },
    { fieldName: 'P_C', dataType: 'text', header: { text: t('월간안전교육계획(분)') } },
    { fieldName: 'R_C', dataType: 'text', header: { text: t('월간안전교육이수(분)') } },
    { fieldName: 'SUM_P', dataType: 'text', header: { text: t('합계계획(분)') } },
    { fieldName: 'SUM_R', dataType: 'text', header: { text: t('합계이수(분)') } },
    { fieldName: 'PLAN_YN', dataType: 'text', header: { text: t('SLI감점대상계획') } },
    { fieldName: 'RESULT_YN', dataType: 'text', header: { text: t('SLI감점대상이수') } },
    { fieldName: 'CMPNY_DIV',visible:false},
    { fieldName: 'BSNS_CD',visible:false},
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields
const onButtonsClick=(btn)=>{
  if(btn.id==='btnClose'){
    close()
  }
  if(btn.id==='btnSearch'){
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run()
  }
}

//  조회
const searchData01 = (idx) => {
  if(DivGubun.value ==='PRE'){
    searchData.value.DIV = 'P'
  }
  else{
    searchData.value.DIV = 'R'
  }
  if(radioV.value ==='Y'){
    searchData.value.TARGET_DIV ='Y'
  }
  else{searchData.value.TARGET_DIV ='N'}
  searchData.value.YYYYMMDD = dayjs().format('YYYYMMDD')
  searchData.value.YYYYMMDD = dayjs().format('YYYYMMDD')

  return commonSearchApi({ queryId: "SAFFC0010_POPUP3_SEARCH_01", param: searchData.value })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = (grid, clickData) => {
  let row = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  popup.value.openPopup(row)
}

defineExpose({
  openPopup
})

</script>

<template>
    
  <VDialog v-model="dialog"  persistent width="1200" 
  class="draggable-dialog" 
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >    
    <div
      class="title-bar d-flex"
      @mousedown="startDragging"
      >
      부서 정기안전보건교육 현황

    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          :title="Gijn"
          :button-list="['btnSearch','btnClose']"
          @click-button="onButtonsClick"
          />
      </v-card-title>
      <v-card-text class="pa-0 px-3">
        <v-sheet style="line-height: 30px;">
          ※ [필독] SLI감점 기준<br>
          - 계획합계 120분, 이수합계 120분 모두 충족이 되어야 SLI 감점이 안됩니다.<br>
          - 교육 제외/불참처리는 미이수로 간주됩니다. 제외/불참자는 별도로 시간을 채워야 합니다.<br>
         <span style="color: #EF5350;">- 휴직/파견/휴직복귀 등으로 해당 월에 120분 교육 이수가 불가능한 경우에는 [SLI점수(안전교육) 집계 제외신청] 메뉴에서 제외 신청을 해 주시기 바랍니다.</span> <br> 
         - 금월 8일 내에 전월 실적 등록 안 될 경우 해당교육은 미이수처리 됩니다. (결재필수)<br>
         - 교육시간(분) 기준은 교육계획 수립 시 "소요시간"에 입력 된 값 기준입니다.<br>
         - 아래 목록에서 성명을 클릭 하면 상세 교육현황을 볼 수 있습니다.<br>
         - SLI점수는 매일 새벽에 1회 집계를 하므로, 금일 수정/입력 된 교육 건은 내일 반영이 됩니다.
        </v-sheet>
        <v-sheet class="mt-3">
          <v-radio-group v-model="radioV" inline>
            <v-radio label="감정대상" value="Y"/>
            <v-radio label="전체" value="N"/>
          </v-radio-group>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 400px;"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>

      </v-card-text>




<SAFFC0010PopUp ref="popup"/>
    </v-card> 
   
  </VDialog>

</template>



<style scoped>
  .draggable-dialog {
    position: absolute;
    user-select: none;
  }

</style>