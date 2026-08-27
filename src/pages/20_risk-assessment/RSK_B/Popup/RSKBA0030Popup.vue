<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, commonRequest } from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from "@/utils/saveFlowHelper"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import IGridTitle from "@/components/IGridTitle.vue"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IUpload from "@/components/IUpload.vue"
import Message from '@hiway/utils/notify'

let dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const fileUpload = ref(null)
const emit = defineEmits(["updated"])

const riskTotalRef = ref(null)
const srsrmTotalRef = ref(null)

// 선택된 셀의 데이터
let popupParams = reactive({})

// 저장 및 수정할 데이터
let saveParams = reactive({
  SRSRM_DESC: '',
  SRSRM_ID: '',
  WORK_STANDARD_ID: '',
  ACT_ID: '',
  RISK_ID: '',
  IM_TOBE_DT: '',
  USR_ID: userStore.userId,
})

const LEVEL = reactive([
  { COD: 1, TXT: '1(최하)' },
  { COD: 2, TXT: '2(하)' },
  { COD: 3, TXT: '3(중)' },
  { COD: 4, TXT: '4(상)' },
  { COD: 5, TXT: '5(최상)' },
])

// popup open
const openPopup = el => {
  console.log(el)
  dialog.value = true

  // 선택된 데이터 복사
  popupParams = Object.assign(el)

  // v-model 값 지정
  saveParams.SRSRM_DESC = popupParams.SRSRM_DESC
  saveParams.SRSRM_ID = popupParams.SRSRM_ID
  saveParams.WORK_STANDARD_ID = popupParams.WORK_STANDARD_ID
  saveParams.ACT_ID = popupParams.ACT_ID
  saveParams.RISK_ID = popupParams.RISK_ID
  saveParams.IM_TOBE_DT = popupParams.IM_TOBE_DT
  saveParams.USR_ID = userStore.userId

  // 개선전 위험성 빈도, 강도 출력 세팅(값)
  for(let i of LEVEL) {
    if (popupParams.BEFOR_FRE === i.COD) {
      popupParams.BEFOR_FRE = i.TXT
    }
    if (popupParams.BEFOR_MAT === i.COD) {
      popupParams.BEFOR_MAT = i.TXT
    }
  }

  // 개선후 위험성 빈도, 강도 출력 세팅(값)
  for(let i of LEVEL) {
    if (popupParams.AFTER_FRE === i.COD) {
      popupParams.AFTER_FRE = i.TXT
    }
    if (popupParams.AFTER_MAT === i.COD) {
      popupParams.AFTER_MAT = i.TXT
    }
  }

  // 개선전 위험성 출력 세팅(값, 색상)
  if (popupParams.RISK_TOTAL < 4) {
    popupParams.RISK_TOTAL = popupParams.RISK_TOTAL === null ? '' : popupParams.RISK_TOTAL + '(매우낮음)'
    riskTotalRef.value.bgColor = '#008000'
  } else if (popupParams.RISK_TOTAL < 8) {
    popupParams.RISK_TOTAL = popupParams.RISK_TOTAL === null ? '' : popupParams.RISK_TOTAL + '(낮음)'
    riskTotalRef.value.bgColor = '#ADFF2F'
  } else if (popupParams.RISK_TOTAL < 15) {
    popupParams.RISK_TOTAL = popupParams.RISK_TOTAL === null ? '' : popupParams.RISK_TOTAL + '(위험)'
    riskTotalRef.value.bgColor = '#FFA500'
  } else {
    popupParams.RISK_TOTAL = popupParams.RISK_TOTAL === null ? '' : popupParams.RISK_TOTAL + '(매우위험)'
    riskTotalRef.value.bgColor = '#FF0000'
  }

  // 개선후 위험성 출력 세팅(값, 색상)
  if (popupParams.SRSRM_TOTAL < 4) {
    popupParams.SRSRM_TOTAL = popupParams.SRSRM_TOTAL === null ? '' : popupParams.SRSRM_TOTAL + '(매우낮음)'
    srsrmTotalRef.value.bgColor = '#008000'
  } else if (popupParams.SRSRM_TOTAL < 8) {
    popupParams.SRSRM_TOTAL = popupParams.SRSRM_TOTAL === null ? '' : popupParams.SRSRM_TOTAL + '(낮음)'
    srsrmTotalRef.value.bgColor = '#ADFF2F'
  } else if (popupParams.SRSRM_TOTAL < 15) {
    popupParams.SRSRM_TOTAL = popupParams.SRSRM_TOTAL === null ? '' : popupParams.SRSRM_TOTAL + '(위험)'
    srsrmTotalRef.value.bgColor = '#FFA500'
  } else if (popupParams.SRSRM_TOTAL < 25) {
    popupParams.SRSRM_TOTAL = popupParams.SRSRM_TOTAL === null ? '' : popupParams.SRSRM_TOTAL + '(매우위험)'
    srsrmTotalRef.value.bgColor = '#FF0000'
  } else {
    popupParams.SRSRM_TOTAL = ''
    srsrmTotalRef.value.bgColor = '#FFFFFF'
  }

  fileUpload.value.setGuid(popupParams.FILE_ID)
  fileUpload.value.onButtonsClick({ id:'btnSearch' })
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    saveData()
    
    // 저장 후 팝업 닫기
    // emit("updated", 'saveAfter')
    // closePopup()
  } else if (btn.id === "btnClose") {
    closePopup()
  }
}

// 수정 및 저장
const saveData = () => {
  // return commonExecuteApi({ queryId : 'RSKBA0030_SAVE_02', list: [saveParams] })
  vm.$swal({ 
    title: t('저장 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      console.log('saveParams = ', saveParams)
      commonExecuteApi({
        queryId : 'RSKBA0030_SAVE_02',
        list: [saveParams]
      }).then(res => {
        if (res.result.status === '200') {
          return Message.success(t('저장 되었습니다.'))
        }
      }).catch(err => {
        return Message.warn(err)
      }).finally(() => {
        emit("updated", 'saveAfter')
        closePopup()
      })
    }
  })

}

// 파일 첨부저장 클릭 후 이벤트
const getFileInfo = data => {
  // 파일ID UPDATE (TB : T_CSX02_WORK_STANDARD_SRSRM)
  let fileSaveParams = []

  fileSaveParams.push({
    FILE_ID: data.fileId,
    RISK_ID: popupParams.RISK_ID,
  })

  commonExecuteApi({ queryId : 'RSKBA0030_SAVE_01', list: fileSaveParams })

  // 파일 데이터 그리드 즉시 반영
  emit("updated", 'saveAfter')
}

// 팝업 닫기
const closePopup = () => {
  dialog.value = false
}

onMounted(() => {
  fileUpload.value.setGuid() //guid설정
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1200"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>중요위험 특별감소대책 실적등록</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('실적등록')"
          :button-list="['btnUpdate']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="flex-column">
            <VTable>
              <thead>
                <tr>
                  <th class="border tdBg" style="width:5%; text-align: center;" rowspan="2">위험요인</th>
                  <th class="border tdBg" style="width:10%; text-align: center;" colspan="2">개선전 위험성</th>
                  <th class="border tdBg" style="width:10%; text-align: center;" rowspan="2">위험성 감소대책</th>
                  <th class="border tdBg" style="width:9%; text-align: center;" colspan="2">개선후 위험성</th>
                  <th class="border tdBg" style="width:10%; text-align: center;" rowspan="2">조치결과</th>
                </tr>
                <tr>
                  <th class="border tdBg" style="width:5%; text-align: center;">빈도</th>
                  <th class="border tdBg" style="width:5%; text-align: center;">강도</th>
                  <th class="border tdBg" style="width:5%; text-align: center;">빈도</th>
                  <th class="border tdBg" style="width:5%; text-align: center;">강도</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <!-- 위험요인 -->
                  <td class="border pa-0" style="width:10%; text-align: center">
                    사고
                  </td>
                  <!-- 개선전 위험성(빈도) -->
                  <td class="border pa-0" style="width:3%; text-align: center;">
                    {{ popupParams.BEFOR_FRE }}
                  </td>
                  <!-- 개선전 위험성(강도) -->
                  <td class="border pa-0" style="width:3%; text-align: center;">
                    {{ popupParams.BEFOR_MAT }}
                  </td>
                  <!-- 위험성 감소대책 -->
                  <td class="border pa-0" style="width:12%; text-align: center">
                    근원적 대책
                  </td>
                  <!-- 개선후 위험성 - 빈도 -->
                  <td class="border pa-0" style="width:3%; text-align: center;">
                    {{ popupParams.AFTER_FRE }}
                  </td>
                  <!-- 개선후 위험성 - 강도 -->
                  <td class="border pa-0" style="width:3%; text-align: center;">
                    {{ popupParams.AFTER_MAT }}
                  </td>
                  <!-- 개선 예정일 -->
                  <td class="border pa-0" style="width:3%; text-align: center;">
                    {{ popupParams.IM_TOBE_DT }}
                  </td>
                </tr>
                <tr>
                  <!-- 위험성 감소대책 -->
                  <td class="border pa-0" style="width:10%;">
                    <v-textarea
                      v-model="popupParams.RISK_NM"
                      dense
                      outlined
                      hide-details
                      :no-resize=false
                      readonly
                    />
                  </td>
                  <!-- 개선전 위험성 -->
                  <td 
                    class="border pa-0" 
                    style="width:3%; text-align: center;" 
                    colspan="2"
                    ref="riskTotalRef"
                  >
                    {{ popupParams.RISK_TOTAL }}
                  </td>
                  <td class="border pa-0" style="width:5%;">
                    <VTextarea
                      v-model="popupParams.RM_NM"
                      dense
                      outlined
                      hide-details
                      :no-resize=false
                      readonly
                    />
                  </td>
                  <!-- 개선후 위험성 -->
                  <td class="border pa-0" style="width:7%; text-align: center;" colspan="2" ref="srsrmTotalRef">
                    {{ popupParams.SRSRM_TOTAL }}
                  </td>
                  <!-- 조치결과 -->
                  <td class="border pa-0" style="width:5%;">
                    <VTextarea
                      v-model="saveParams.SRSRM_DESC"
                      dense
                      outlined
                      :no-resize=false
                      hide-details
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </v-sheet>
          <v-sheet class="mt-3 pa-0">
            <IUpload
              ref="fileUpload" 
              style="height: 300px"
              @uploaded="getFileInfo"
              class="pa-0"
            />
          </v-sheet>
          <v-sheet class="mt-3">
            <IGridTitle
              :button-list="['btnClose']"
              @click-button="onButtonsClick"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.tdBg{
  background-color: #e8eaf2;
  height: 20px !important;
}
</style>
