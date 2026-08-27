<!-- SPPDA0010Tab1위험기계기구 안전검사 기본정보/크레인 탭-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue";
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n";
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from 'lodash-es'
import { getCodeList } from '@hiway/api/commonApi'
import DeptPopup from "@/components/popup/DeptPopup.vue"
import dayjs from "dayjs"
import Message from "@hiway/utils/notify"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"
import EmpPopup from "@/components/popup/EmpPopup.vue"

const vm = getCurrentInstance().proxy; //다이얼로그관련
const userStore = useUserStore(); //유저정보
const t = useI18n().t; //다국어
const props = defineProps({
  clickData: {
    type: Object,
    required: false,
    default() {
      return {};
    },
  },
  SaveFlag: {
    type: Boolean,
  },
  codeList: {
    type: Object
  }
})
const codeList = reactive([])
const deptPopUp = ref(null)
const gubun = ref("")
const inputData = ref({})
const emit = defineEmits(["saveData"])
const fileUpload = ref(null)
const empPopup = ref(null)

onMounted(() => {
  Promise.all([
    getCodeList("HHIFB110"), //1
    getCodeList("HHIF810A"), //2
    getCodeList("HHIF812"), //3
    getCodeList("HHIF815"), //4
  ]).then((res) => {
    codeList.STATUS = res[0].ORESULT_CUR;
    codeList.EQUIP_KIND_TEST = res[1].ORESULT_CUR;
    codeList.EQUIP_KIND_DETAIL = res[2].ORESULT_CUR;
    codeList.DRIVE_METHOD = res[3].ORESULT_CUR;
  })
  setClickData() 
})

watch(() => props.codeList, (newValue, oldValue) => {
  if(!isEmpty(newValue)) {
    codeList.STATUS = props.codeList.FB110
    codeList.EQUIP_KIND_TEST = props.codeList.F810A
    codeList.EQUIP_KIND_DETAIL = props.codeList.F812
    codeList.DRIVE_METHOD = props.codeList.F815
  }
}, { deep: true })

watch(
  () => props.clickData,
  (newValue) => {
    setClickData()
  }
)

const openPopup = (e) => {
  if (e == "사용부서" || e == "관리조직") {
    gubun.value = e;
    deptPopUp.value.openPopup()
  }

  if (e == "관리담당자" || e == "사용부서담당자") {
    gubun.value = e
    if (e == "관리담당자") {
      empPopup.value.openPopup({ EMP_NM: inputData.value.CHARGE_EMP_NM })
    }
    empPopup.value.openPopup({ EMP_NM: inputData.value.ITMANAGER_EMPNM })
  }

  if (e == "파일") {
    fileUpload.value.openPopup(inputData.value.ETC_FILE_ID)
  }
}

const setClickData = () => {
  if (props.clickData.length == 0) {
    inputData.value = {
      CMPNY_DIV: userStore.cmpnyDiv,
      EQUIP_KIND: 'A',
      STATUS: '20',
      CHARGE_COMPANY: userStore.cmpnyDiv,
      CHARGE_EMP_NO: userStore.empNo,
      CHARGE_EMP_NM: userStore.empNm,
      PORT_CRANE_YN: 'N',
    }
  }
  for (let i in props.clickData) {
    inputData.value[i] = props.clickData[i]
  }
  if (inputData.value.INSTALL_DT) {
    inputData.value.INSTALL_DT = dayjs(inputData.value.INSTALL_DT).format('YYYY-MM-DD')
  }
}

const onDeptSelected = (row) => {
  // if (gubun.value == "관리조직") {
  //   inputData.value.MANAGE_DEPT_CD = row.DEPT_CD;
  //   inputData.value.MANAGE_ASGN_CD = row.ASGN_CD;
  //   inputData.value.MANAGE_ASGN_NM = row.ASGN_FULL_NM;
  //   inputData.value.MANAGE_COMPANY = row.CMPNY_DIV;
  //   inputData.value.MANAGE_ASGN_FULL_NM = row.ASGN_FULL_NM;
  //   console.log("hhhhhh");
  // }
  // if (gubun.value == "사용부서") {
  //   inputData.value.USE_DEPT_COMPANY = row.CMPNY_DIV;
  //   inputData.value.USE_DEPT_CD = row.DEPT_CD;
  //   inputData.value.USE_DEPT_NM = row.ASGN_SHRT_NM;
  // }
};

const onEmpSelected = (row) => {
  if (gubun.value == "관리담당자") {
    inputData.value.CHARGE_EMP_NM = row.EMP_NM;
    inputData.value.CHARGE_EMP_NO = row.EMP_NO;
    inputData.value.CHARGE_COMPANY = row.CMPNY_DIV;

    inputData.value.MANAGE_DEPT_CD = row.DEPT_CD;
    inputData.value.MANAGE_ASGN_CD = row.ASGN_CD;
    inputData.value.MANAGE_ASGN_NM = row.ASGN_NM;
    inputData.value.MANAGE_COMPANY = row.CMPNY_DIV;
    inputData.value.MANAGE_ASGN_FULL_NM = row.ASGN_NM;
  }
  if (gubun.value == "사용부서담당자") {
    inputData.value.ITMANAGER_EMPNM = row.EMP_NM;
    inputData.value.ITMANAGER_COMPANY = row.CMPNY_DIV;
    inputData.value.ITMANAGER_EMPNO = row.EMP_NO;

    inputData.value.USE_DEPT_COMPANY = row.CMPNY_DIV;
    inputData.value.USE_DEPT_CD = row.DEPT_CD;
    inputData.value.USE_DEPT_NM = row.DEPT_NM;
  }
};

const uploaded = (e) => {
  inputData.value.ETC_FILE_ID = e.fileId;
  inputData.value.ETC_FILE_YN = "Y";
};

watch(
  () => props.SaveFlag,
  (newValue) => {
    if (newValue) {
      if (
        !inputData.value.EQUIP_NO ||
        !inputData.value.STATUS ||
        !inputData.value.USE_DEPT_NM ||
        !inputData.value.MANAGE_ASGN_FULL_NM ||
        !inputData.value.CHARGE_EMP_NM ||
        !inputData.value.ITMANAGER_EMPNM
      ) {
        emit("saveData", undefined);
        return Message.warn(t("필수입력을 확인해주세요"));
      }
      emit("saveData", inputData.value);
    }
  }
);
</script>

<template>
  <div class="d-flex align-center">
    <i-input
      :label="t('장비번호')"
      required
      margin="10px"
      width="250px"
      label-width="100px"
      v-model="inputData.EQUIP_NO"
    />

    <i-select
      :label="t('장비상태')"
      required
      margin="10px"
      width="250px"
      label-width="100px"
      v-model="inputData.STATUS"
      :items="codeList.STATUS"
      item-value="COD"
      item-title="TXT"
    />
    <i-input
      :label="t('사용부서')"
      margin="10px"
      readonly
      width="350px"
      label-width="100px"
      v-model="inputData.USE_DEPT_NM"
    />
    <!-- @click:appendInner="openPopup('사용부서')"
      @keydown.enter="
        (e) => {
          openPopup('사용부서');
        }
      " -->
    <i-input
      :label="t('관리조직')"
      margin="10px"
      readonly
      width="400px"
      label-width="100px"
      v-model="inputData.MANAGE_ASGN_FULL_NM"
    />
    <!-- @click:appendInner="openPopup('관리조직')"
      @keydown.enter="
        (e) => {
          openPopup('관리조직');
        }
      " -->
    <i-input
      :label="t('관리담당자')"
      required
      margin="4px"
      width="250px"
      append-inner-icon="mdi-magnify"
      @click:appendInner="openPopup('관리담당자')"
      @keydown.enter="
        (e) => {
          openPopup('관리담당자');
        }
      "
      label-width="100px"
      v-model="inputData.CHARGE_EMP_NM"
    />
    <i-input
      :label="t('')"
      margin="10px"
      readonly
      width="140px"
      v-model="inputData.CHARGE_EMP_NO"
    />
    <v-checkbox
      v-model="inputData.NONTEST_YN"
      :label="t('검사제외')"
      style="margin-right: 10px"
    />
  </div>

  <div class="d-flex mt-3">
    <i-input
      :label="t('설치위치')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.INSTALL_PLACE"
    />
    <i-input
      :label="t('설치일자')"
      width="250px"
      margin="10px"
      label-width="100px"
      type="date"
      v-model="inputData.INSTALL_DT"
    />
    <i-input
      :label="t('사용부서담당자')"
      required
      width="250px"
      label-width="100px"
      margin="4px"
      append-inner-icon="mdi-magnify"
      @click:appendInner="openPopup('사용부서담당자')"
      @keydown.enter="
        (e) => {
          openPopup('사용부서담당자');
        }
      "
      v-model="inputData.ITMANAGER_EMPNM"
    />
    <i-input
      :label="t('')"
      margin="10px"
      readonly
      width="140px"
      v-model="inputData.ITMANAGER_EMPNO"
    />
  </div>

  <div class="d-flex mt-3">
    <i-input
      :label="t('제조사')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.MAKER"
    />
    <i-input
      :label="t('용량(TON)')"
      width="250px"
      margin="10px"
      label-width="100px"
      number
      v-model="inputData.EQUIP_SIZE_DETAIL"
    />
    <i-input
      :label="t('용량상세')"
      width="250px"
      margin="10px"
      number
      label-width="100px"
      v-model="inputData.EQUIP_SIZE"
    />
    <i-select
      :label="t('검사기준분류')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.EQUIP_KIND_TEST"
      :items="codeList.EQUIP_KIND_TEST"
      item-value="COD"
      item-title="TXT"
    />
    <i-select
      :label="t('일반기준분류')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.EQUIP_KIND_DETAIL"
      :items="codeList.EQUIP_KIND_DETAIL"
      item-value="COD"
      item-title="TXT"
    />
    <i-input
      :label="t('설비번호(TRMS)')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.TRMS_NO"
    />
  </div>

  <div class="d-flex mt-3">
    <i-input
      :label="t('SPAN(MR)')"
      width="250px"
      margin="10px"
      label-width="100px"
      number
      v-model="inputData.SPAN"
    />
    <i-input
      :label="t('양정(MR)')"
      width="250px"
      margin="10px"
      label-width="100px"
      number
      v-model="inputData.LIFT"
    />
    <i-select
      :label="t('운전방식')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.DRIVE_METHOD"
      :items="codeList.DRIVE_METHOD"
      item-value="COD"
      item-title="TXT"
    />
    <i-input
      :label="t('비고')"
      label-width="100px"
      margin="10px"
      width="510px"
      v-model="inputData.REMARK"
    />
    <i-input
      :label="t('기타첨부')"
      width="250px"
      margin="10px"
      label-width="100px"
      v-model="inputData.ETC_FILE_YN"
      readonly
      @click="openPopup('파일')"
    >
    <template v-slot:append-inner>
      <v-icon icon="mdi-paperclip" @click="openPopup('파일')"></v-icon>
    </template>    
    </i-input>
  </div>

  <DeptPopup ref="deptPopUp" @selected="onDeptSelected" />
  <EmpPopup ref="empPopup" @selected="onEmpSelected" />

  <IUploadPopup ref="fileUpload" @uploaded="uploaded($event)" />
</template>
<style lang="scss" scoped></style>
