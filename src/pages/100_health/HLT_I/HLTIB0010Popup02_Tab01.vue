<script setup>
import { ref, reactive, nextTick } from 'vue'
import ImageViewerSingle from '@/components/popup/ImageViewerSingle.vue'

const props = defineProps({
  unitWorkData: {
    type: Object,
  },
  disableValue: {
    type: Object,
  },
})

const bfrFileId = ref(null) //개선전 파일 ID
const aftFileId = ref(null) //개선후 파일 ID

const unitWorkImprovementField = reactive({
  IMP_ITM_MTHD: 'N', //개선항목 작업방법개선
  IMP_ITM_PLC: 'N', //개선항목 작업장개선
  IMP_ITM_TOOL: 'N', //개선항목 치공구개선
  IMP_ITM_EQP: 'N', //개선항목 장비개선
  IMP_ITM_MGT: 'N', //개선항목 관리적개선
  FILE_ID_BFR: '', //개선전 FILE_ID
  FILE_ID_AFT: '', //개선후 FILE_ID
  IMP_DSC_BFR: '', //변경내용_개선전
  IMP_DSC_AFT: '', //변경내용_개선후
  IMP_EFFC: '', //개선효과
  IMP_COST: '', //투자비용(원)
})

const disableCheckboxValue = reactive({
  IMP_ITM_MTHD: false,
  IMP_ITM_PLC: false,
  IMP_ITM_TOOL: false,
  IMP_ITM_EQP: false,
  IMP_ITM_MGT: false,
})

onMounted(() => {})

const setField = () => {
  nextTick(() => {
    for (const [key, value] of Object.entries(props.unitWorkData)) {
      if (unitWorkImprovementField.hasOwnProperty(key)) {
        unitWorkImprovementField[key] = value
      }
    }

    for (const [key, value] of Object.entries(props.disableValue)) {
      if (disableCheckboxValue.hasOwnProperty(key)) {
        disableCheckboxValue[key] = value
      }
    }
    if (unitWorkImprovementField.FILE_ID_BFR) {
      bfrFileId.value.setGuid(unitWorkImprovementField.FILE_ID_BFR)
      bfrFileId.value.onButtonsClick({ id: 'btnSearch' })
    }
    if (unitWorkImprovementField.FILE_ID_AFT) {
      aftFileId.value.setGuid(unitWorkImprovementField.FILE_ID_AFT)
      aftFileId.value.onButtonsClick({ id: 'btnSearch' })
    }
  })
}

//개선전 파일 업로드 이벤트
const bfrUploaded = (val) => {
  unitWorkImprovementField.FILE_ID_BFR = val.FILE_ID
}

const aftUploaded = (val) => {
  unitWorkImprovementField.FILE_ID_AFT = val.FILE_ID
}

//저장할때 unitWorkImprovementField 리턴
const getUnitWorkField = () => {
  return unitWorkImprovementField
}

const disableImageButton = () => {
  bfrFileId.value.disableButton('btnFileUpload')
  bfrFileId.value.disableButton('btnDelete')
  aftFileId.value.disableButton('btnFileUpload')
  aftFileId.value.disableButton('btnDelete')
}

const enableImageButton = () => {
  bfrFileId.value.enableButton('btnFileUpload')
  bfrFileId.value.enableButton('btnDelete')
  aftFileId.value.enableButton('btnFileUpload')
  aftFileId.value.enableButton('btnDelete')
}

const initField = () => {
  for (let i in unitWorkImprovementField) {
    unitWorkImprovementField[i] = ''
  }
}

defineExpose({
  getUnitWorkField,
  disableImageButton,
  enableImageButton,
  setField,
  initField,
})
</script>

<template>
  <div class="searchArea">
    <div class="d-flex mt-2 justify-space-around">
      <v-checkbox
        label="작업 방법 개선"
        true-value="Y"
        false-value="N"
        v-model="unitWorkImprovementField.IMP_ITM_MTHD"
        :disabled="disableCheckboxValue.IMP_ITM_MTHD"
      ></v-checkbox>
      <v-checkbox
        label="작업장 개선"
        true-value="Y"
        false-value="N"
        v-model="unitWorkImprovementField.IMP_ITM_PLC"
        :disabled="disableCheckboxValue.IMP_ITM_PLC"
      ></v-checkbox>
      <v-checkbox
        label="치공구 개선"
        true-value="Y"
        false-value="N"
        v-model="unitWorkImprovementField.IMP_ITM_TOOL"
        :disabled="disableCheckboxValue.IMP_ITM_TOOL"
      ></v-checkbox>
      <v-checkbox
        label="장비 개선"
        true-value="Y"
        false-value="N"
        v-model="unitWorkImprovementField.IMP_ITM_EQP"
        :disabled="disableCheckboxValue.IMP_ITM_EQP"
      ></v-checkbox>
      <v-checkbox
        label="관리적 개선"
        true-value="Y"
        false-value="N"
        v-model="unitWorkImprovementField.IMP_ITM_MGT"
        :disabled="disableCheckboxValue.IMP_ITM_MGT"
      ></v-checkbox>
    </div>
    <div>
      <table class="mt-2">
        <tr>
          <td>구분</td>
          <td>개선 前</td>
          <td>개선 後</td>
        </tr>
        <tr>
          <td>사진</td>
          <td>
            <ImageViewerSingle height="300" ref="bfrFileId" @uploaded="bfrUploaded"></ImageViewerSingle>
          </td>
          <td>
            <ImageViewerSingle height="300" ref="aftFileId" @uploaded="aftUploaded"></ImageViewerSingle>
          </td>
        </tr>
        <tr>
          <td>변경 내용</td>
          <td><i-textarea width="100%" v-model="unitWorkImprovementField.IMP_DSC_BFR"></i-textarea></td>
          <td><i-textarea width="100%" v-model="unitWorkImprovementField.IMP_DSC_AFT"></i-textarea></td>
        </tr>
        <tr>
          <td>개선 효과</td>
          <td colspan="2"><i-textarea width="100%" v-model="unitWorkImprovementField.IMP_EFFC"></i-textarea></td>
        </tr>
        <tr>
          <td>투자 비용</td>
          <td colspan="2"><i-textarea width="100%" v-model="unitWorkImprovementField.IMP_COST"></i-textarea></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
table {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid black;
}
td {
  padding: 4px;
  text-align: center; /* 가로 가운데 정렬 */
  vertical-align: middle; /* 세로 가운데 정렬 */
  border: 1px solid black;
  font-size: 16px;
}
</style>
