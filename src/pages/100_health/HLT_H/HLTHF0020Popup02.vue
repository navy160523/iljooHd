<script setup>
import IMenuTitle from "@/components/IGridTitle.vue";
import { ref, reactive, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
  commonSendApi,
} from "@hiway/api/commonApi";
import queryFlowHelper from "@/utils/searchFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper";
import {
  commonDownloadFilesApi,
  commonDeletFilesApi,
  commonBigUploadFilesApi,
  commonDeleteAllFilesApi,
} from "@hiway/api/commonFileApi";
import { useCommonStore } from "@hiway/stores/common";
import Message from "@hiway/utils/notify";

import saveFlowHelper from "@/utils/saveFlowHelper";
import dayjs from "dayjs";
import { useUserStore } from "@hiway/stores/user";

import image16 from "@/assets/images/index/image16.png";
import _ from "lodash";
import Compressor from "compressorjs";
import { useRoute } from "vue-router";
import IUploadImageMulit from "@/components/IUploadImageMulit.vue";

const dialog = ref(null);
const userStore = useUserStore();
const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const route = useRoute();
const emit = defineEmits(["Saved"]);
const commonStore = useCommonStore();
const dataRes = ref();
const selectDiv = ref("");
const fileUpload1 = ref(null);
const mainFileUpdate = ref(false);
const isDisabled = ref(false);

const refImage = ref(true); // 대표이미지설정 여부

const checkImageButton = reactive([
  "btnFileUpload",
  "btnDownLoad",
  "btnDelete",
]);

const codeList = reactive({
  division: [],
  itemName: [],
  deleteYn: [],
  YN: [
    { TXT: "사용", COD: "N" },
    { TXT: "사용중지", COD: "Y" },
  ],
  //VEND_SEQ: [],
});

const imageField = reactive({
  files: [],
  images: [],
});

const itemField = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION: "", // 안전보호구 구분
  ITEM_SEQ: "", //제품 순번
  ITEM_NAME: "", //품명
  MODEL: "", //모델명
  VEND: "", //납품업체
  PASS_NO: "", //합격번호
  MAT_NO: "", //자재번호
  COST: "", //단가
  ORDER_NUM: "", //정렬순서
  DELETE_YN: "", //현재상태
  REMARK: "", //비고
  CAUTION: "", //주의사항
  FILE_ID: "", //사진
  UPDATE_YN: "N", //수정 여부
  //MAIN_FILE_NO: '',
});

const searchParams = reactive({
  CMPNY_DIV: itemField.CMPNY_DIV,
  FILE_ID: "",
});

const readOnlyValue = reactive({
  DIVISION: false,
  ITEM_SEQ: true,
});

const initCodeList = async (division, selectBoxRes) => {
  // if (division != "") {
  //   const res = await Promise.all([
  //     commonSearchApi({
  //       queryId: "HLTHF0020_SEARCH_VEND",
  //       param: {
  //         CMPNY_DIV: userStore.cmpnyDiv,
  //         DIVISION: division,
  //       },
  //     }),
  //   ]);

  //   codeList.VEND_SEQ = [...res[0].ORESULT_CUR];
  //   console.log('??? : ', codeList.VEND_SEQ)
  // }
  // if (!codeList.VEND_SEQ.some((item) => item.TXT === "선택")) {
  //   codeList.VEND_SEQ.unshift({ TXT: "선택", COD: "" });
  // }

  dataRes.value = selectBoxRes;

  codeList.division = selectBoxRes[0].ORESULT_CUR;

  if (!codeList.division.some((item) => item.TXT === "선택")) {
    codeList.division.unshift({ TXT: "선택", COD: "" });
  }

  switch (division) {
    case "A":
      codeList.itemName = selectBoxRes[1].ORESULT_CUR;

      break;
    case "B":
      codeList.itemName = selectBoxRes[2].ORESULT_CUR;
      break;
    case "C":
      codeList.itemName = selectBoxRes[3].ORESULT_CUR;
      break;
    default:
      codeList.itemName = [];
      if (!codeList.itemName.some((item) => item.TXT === "선택")) {
        codeList.itemName.unshift({ TXT: "선택", COD: "" });
      }
      break;
  }

  // Promise.all([
  //   //구분 조회
  //   getCodeList("HHII710"),
  //   //품명 조회
  //   getCodeList("HHII710A"),
  //   getCodeList("HHII710B"),
  //   getCodeList("HHII710C"),
  // ]).then((res) => {
  //   dataRes.value = res;
  //   //구분
  //   codeList.division = res[0].ORESULT_CUR;
  //   codeList.division.unshift({ TXT: "선택", COD: "" });

  //   //품명
  //   switch (division) {
  //     case "A":
  //       codeList.itemName = res[1].ORESULT_CUR;
  //       break;
  //     case "B":
  //       codeList.itemName = res[2].ORESULT_CUR;
  //       break;
  //     case "C":
  //       codeList.itemName = res[3].ORESULT_CUR;
  //       break;
  //   }

  //   if (!codeList.itemName.some((item) => item.TXT === "선택")) {
  //     codeList.itemName.unshift({ TXT: "선택", COD: "" });
  //   }
  // });
};

const openPopup = (division, selectBoxRes, data, editValue = false) => {
  dialog.value = true;
  imageField.images = [];
  imageField.files = [];
  itemField.DIVISION = division;
  itemField.DELETE_YN = "N";
  itemField.UPDATE_YN = "N";
  isDisabled.value = editValue
  //점검사진,조치사진데이터 초기화
  fileUpload1.value.clearGrid();

  initCodeList(division, selectBoxRes);

  if (data) {
    readOnlyValue.DIVISION = true;
    readOnlyValue.ITEM_SEQ = true;
    itemField.UPDATE_YN = "Y";

    for (const [key, value] of Object.entries(data)) {
      if (itemField.hasOwnProperty(key)) {
        // if (key === "ITEM_NAME") {
        //   itemField[key] = value.substring(1);
        // } else {
        //   itemField[key] = value;
        // }
        itemField[key] = value;
      }
    }

    if (itemField.FILE_ID) {
      fileUpload1.value.setGuid(itemField.FILE_ID);
      fileUpload1.value.onButtonsClick({ id: "btnSearch" });
      // setTimeout(() => {
      //   fileUpload1.value.setRefYn(itemField.MAIN_FILE_NO)
      // }, 500)
    }
  } else {
    itemField.FILE_ID = create_UUID();
  }
  searchParams.FILE_ID = itemField.FILE_ID;

  // onButtonsClick({ id: "btnSearch" });
};

const closePopup = () => {
  if (mainFileUpdate.value) {
    emit("Saved");
  }

  dialog.value = false;
  //초기화
  readOnlyValue.DIVISION = false; //년도 readonly 해제
  //readOnlyValue.ITEM_SEQ = false; //신청시기 readonly 해제
  for (let i in itemField) {
    itemField[i] = "";
  }
};

const onButtonsClick = async (btn) => {
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run();
  } else if (btn.id === "btnClose") {
    closePopup();
  } else if (btn.id === "btnSearch") {
    await searchData();
  }
};

const searchFile = ref(null);

// 조회
const searchData = async () => {
  imageField.files = [];
  uploadFiles.value = [];

  const res = await commonSearchApi({
    queryId: "searchFile",
    param: searchParams,
  });

  await afterSearch(res);
};

const afterSearch = async (res) => {
  if (res.ORESULT_CUR.length < 1) {
    return;
  }

  await fileLoad(res);
  await imageLoad(res);
};

const fileLoad = async (res) => {
  const file = res.ORESULT_CUR[0];
  const response = await fetch(file.FILE_PATH);
  const blob = await response.blob();
  const newFile = new File([blob], file.FILE_NAME_ORIGINAL, {
    type: file.FILE_TYPE,
  });
  imageField.files.push(newFile);
  searchFile.value = newFile;

  originParams[0].CMPNY_DIV = userStore.cmpnyDiv;
  originParams[0].FILE_ID = file.FILE_ID;
  originParams[0].FILE_NO = "1";
  originParams[0].FILE_PATH = file.FILE_PATH;
  originParams[0].FILE_NAME = file.FILE_NAME;
};

const imageLoad = async (res) => {
  const file = res.ORESULT_CUR[0];
  let fileName = null;
  let blob2 = null;
  let imageURL = null;
  let img = new Image(); // 이미지 요소 생성

  commonDownloadFilesApi(file)
    .then((res2) => {
      // Image Load
      fileName = res2.contentDisposition.match(/fileName="([^"]+)"/)[1];
      blob2 = new Blob([res2]);
      imageURL = URL.createObjectURL(blob2);
      img = new Image(); // 이미지 요소 생성
      img.src = imageURL; // 이미지 URL 설정
      img.alt = fileName;
      // dummy.value = imageURL
    })
    .finally(() => {
      imageField.images = imageURL;
    });
};

//저장관련 로직 시작
const beforeSave = () => {
  if (!itemField.DIVISION) {
    Message.warn(t("구분은 필수값 입니다."));
    return false;
  } else if (!itemField.ITEM_NAME) {
    Message.warn(t("품명은 필수값 입니다."));
    return false;
  } else if (!itemField.MODEL) {
    Message.warn(t("모델명은 필수값 입니다."));
    return false;
  } else if (!itemField.VEND) {
    Message.warn(t("납품업체은 필수값 입니다."));
    return false;
  } else if (!itemField.PASS_NO) {
    Message.warn(t("합격번호는 필수값 입니다."));
    return false;
  } else if (!itemField.MAT_NO) {
    Message.warn(t("자재번호는 필수값 입니다."));
    return false;
  } else if (!itemField.COST) {
    Message.warn(t("단가는 필수값 입니다."));
    return false;
  }
  return true;
};

let originParams = [
  {
    CMPNY_DIV: "",
    FILE_ID: "",
    FILE_NO: "1",
    FILE_PATH: "",
    FILE_NAME: "",
  },
];

const deleteImage = async () => {
  const deldeteData = JSON.stringify(originParams);
  await commonDeletFilesApi(deldeteData);
};

const saveData = async () => {
  // await deleteImage();

  // if (imageField.files.length > 0) {
  //   await fileUpload();
  // }

  let saveParam = [];
  let saveData = {
    CMPNY_DIV: userStore.cmpnyDiv,
    ITEM_SEQ: itemField.ITEM_SEQ,
    DIVISION: itemField.DIVISION,
    ITEM_NAME: itemField.ITEM_NAME.substring(1),
    MODEL: itemField.MODEL,
    PASS_NO: itemField.PASS_NO,
    MAT_NO: itemField.MAT_NO,
    COST: itemField.COST,
    VEND: itemField.VEND,
    CAUTION: itemField.CAUTION,
    REMARK: itemField.REMARK,
    FILE_ID: itemField.FILE_ID,
    DELETE_YN: itemField.DELETE_YN,
    USER_ID: userStore.userId,
    ORDER_NUM: itemField.ORDER_NUM,
    UPDATE_YN: itemField.UPDATE_YN,
  };

  saveParam.push(saveData);
  return commonExecuteApi({
    queryId: "HLTHF0020_SAVE_01",
    list: saveParam,
  });
};

const afterSave = (res) => {
  emit("Saved");
  closePopup();
};

//저장관련 로직 끝

onMounted(() => {});

defineExpose({
  openPopup,
});

const selectDivision = async () => {
  codeList.itemName = [];

  selectDiv.value = itemField.DIVISION;

  // if (itemField.DIVISION) {
  //   const res = await Promise.all([
  //     commonSearchApi({
  //       queryId: "HLTHF0020_SEARCH_VEND",
  //       param: {
  //         CMPNY_DIV: userStore.cmpnyDiv,
  //         DIVISION: itemField.DIVISION,
  //       },
  //     }),
  //   ]);

  //   codeList.VEND_SEQ = [...res[0].ORESULT_CUR];

  //   if (!codeList.VEND_SEQ.some((item) => item.TXT === "선택")) {
  //     codeList.VEND_SEQ.unshift({ TXT: "선택", COD: "" });
  //   }
  // }

  switch (itemField.DIVISION) {
    case "":
      codeList.itemName = [];
      break;
    case "A":
      codeList.itemName = [...dataRes.value[1].ORESULT_CUR];
      break;
    case "B":
      codeList.itemName = [...dataRes.value[2].ORESULT_CUR];
      break;
    case "C":
      codeList.itemName = [...dataRes.value[3].ORESULT_CUR];
      break;
  }

  if (!codeList.itemName.some((item) => item.TXT === "선택")) {
    codeList.itemName.unshift({ TXT: "선택", COD: "" });
  }
  itemField.ITEM_NAME = "";
};

const divisionValidation = async (isOpen) => {
  if (itemField.DIVISION == "" && isOpen) {
    Message.warn(t("구분을 선택해주세요."));
  }
};

//---------- 이미지 등록-----------
const fileTypes = ["JGP", "GIF", "BMP", "PNG", "JPEG"];
const uploadFiles = ref([]);
const images = ref(null);
const items = ref([]);
const data = ref(null);

const selectFiles = ref(null);

const selectFile = (e) => {
  selectFiles.value = e;

  if (e.length < 1) {
    imageField.images = [];
    return;
  }

  for (let file of e) {
    //파일 타입
    const fType = file.name.split(".").pop().toUpperCase();

    const fUseType = fileTypes.map((item) => {
      return item.toUpperCase();
    });

    if (file.size >= 20 * 1024 * 1024) {
      //props.maxFileSize
      Message.err(
        20 + t("MB 이상 첨부파일은 등록 불가능 합니다.") + "<br>" + file.name
      );

      return;
    } else if (!_.includes(fUseType, fType)) {
      const msg = props.imgOnly
        ? t("이미지만 업로드 가능합니다.")
        : t("사용할 수 없는 파일입니다.");

      Message.err(msg + "<br>" + file.name);

      return;
    }
  }

  for (let file of e) {
    file.FILE_ID = itemField.FILE_ID;
    const fType = file.name.split(".").pop().toUpperCase();
    if (fileTypes.includes(fType)) {
      new Compressor(file, {
        convertSize: 1000000, // 1MB
        quality: 0.8,
        success(result) {
          uploadFiles.value.push({
            fileName: result.name,
            file: result,
          });

          let objectURL = URL.createObjectURL(file);

          items.value.push({
            src: objectURL,
          });

          data.value = {
            FILE_NAME: result.name,
            FILE_NAME_ORIGINAL: result.name,
            FILE_SIZE: Math.round(result.size / 1024.0),
            PROGRESS: 0,
            FILE_PATH: "",
            STATUS: "N",
            SEND_PATH: "",
            FILE_TITLE: result.name,
            FILE_TYPE: "",
          };

          imageField.images = objectURL;
        },
      });
    }
  }
};

const fileUpload = async () => {
  let hasErr = false;
  const fileTemp = _.find(uploadFiles.value, {
    fileName: data.value.FILE_TITLE,
  });
  const file = _.find(uploadFiles.value, {
    fileName: data.value.FILE_TITLE,
  }).file;

  // 자르는 사이즈
  const chunkSize = 1024 * 1024; // 1MB
  // total size 계산
  const totalChunks = Math.ceil(file.size / chunkSize);

  let currentChunk = 0;

  const sendNextFile = async () => {
    // chunk size 만큼 데이터 분할
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // form data 형식으로 전송
    const formData = new FormData();

    const param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: itemField.FILE_ID,
      FILE_NO: "1",
      FILE_TITLE: file.name,
      FILE_NAME_ORIGINAL: file.name,
      FILE_NAME: file.name,
      FILE_PATH: `${commonStore.systemCode}${route.path}/`,
      FILE_TYPE: file.name.split(".").pop(),
      FILE_SIZE: Math.round(file.size / 1024.0),
      USER_ID: userStore.userId,
      CHUNK_NUMBER: currentChunk,
      TOTAL_CHUNKS: totalChunks,
    };
    formData.append("file", chunk, file.name);
    formData.append(
      "param",
      new Blob([JSON.stringify(param)], { type: "application/json" })
    );

    await commonBigUploadFilesApi(formData)
      .then(async (res) => {
        // 전송 결과가 207이면 다음 파일 조각 전송
        if (res.result.status === "207") {
          currentChunk++;
          if (currentChunk < totalChunks) {
            await sendNextFile();
          }
        } else if (res.result.status === "200") {
          Message.success(t("업로드 되었습니다."));
        }
      })
      .catch((e) => {
        hasErr = true;
        grdMain.value.getDataProvider().setValue(checkedRow[i], "STATUS", "E");
      });
  };
  await sendNextFile();

  if (!hasErr) {
    emit("uploaded", {
      fileId: itemField.FILE_ID,
    });
  }
};

const create_UUID = () => {
  let dt = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

//------ computed

const formattedCost = computed({
  get() {
    return itemField.COST.toLocaleString()
      ? itemField.COST.toLocaleString()
      : "";
  },
  set(value) {
    itemField.COST = Number(value.replace(/[^0-9]/g, ""));
  },
});

// 사진 등록

//제품사진 업로드 이벤트
const uploadCheckPicture = (val) => {
  itemField.FILE_ID = val.FILE_ID;
};

// //점검사진 대표이미지가 선택되었을때 실행되는 함수
// const selectedCheckRefImage = (val) => {
//   //저장되지 않은 상태면 파일번호를 넣어준다.
//   if (!itemField.ITEM_SEQ) {
//     itemField.MAIN_FILE_NO = val.FILE_NO;
//   } else {
//     itemField.MAIN_FILE_NO = val.FILE_NO;

//     console.log('??? : ', val)
//     console.log('???222 : ', val.FILE_NO)
//     //저장된 상태면 바로 업데이트를 실행한다.
//     let saveParam = [];
//     let saveData = {
//       CMPNY_DIV: itemField.CMPNY_DIV,
//       DIVISION: itemField.DIVISION,
//       ITEM_SEQ: itemField.ITEM_SEQ,
//       MAIN_FILE_NO: val.FILE_NO,
//     };

//     console.log('???333 : ', saveData)
//     saveParam.push(saveData);
//     commonExecuteApi({
//       queryId: "HLTHF0020_SAVE_02",
//       list: saveParam,
//     }).then((res)=>{
//       mainFileUpdate.value = true;
//     });
//   }
// };

// const deletedCheckRefImage = (val) => {
//   if (!itemField.ITEM_SEQ) {
//     for (let i = 0; i < val.length; i++) {
//       if (itemField.MAIN_FILE_NO === val[i].FILE_NO) {
//         Message.warn(
//           t("대표이미지가 설정된 파일은 제품등록 저장 후 삭제 해주세요.")
//         );
//         fileUpload1.value.checkDeleteRef(false);
//         return false;
//       } else {
//         fileUpload1.value.checkDeleteRef(true);
//       }
//     }
//   } else {
//     for (let i = 0; i < val.length; i++) {
//       if (itemField.MAIN_FILE_NO === val[i].FILE_NO) {
//         let paramData = [];
//         let param = {
//           CMPNY_DIV: itemField.CMPNY_DIV,
//           DIVISION: itemField.DIVISION,
//           ITEM_SEQ: itemField.ITEM_SEQ,
//           MAIN_FILE_NO: itemField.MAIN_FILE_NO,
//         };
//         paramData.push(param);
//         commonExecuteApi({
//           queryId: "HLTHF0020_DELETE02",
//           list: paramData,
//         });
//       }
//     }
//   }
// };
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="900"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>제품 등록</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title>
        <IMenuTitle
          title="제품 상세"
          ref="menuTitle"
          :use-permission="true"
          :button-list="[
            'btnUpdate', //저장
            'btnClose', //닫기
          ]"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="searchArea flex-column">
          <div class="d-flex flex-gap">
            <i-select
              :label="$t('구분')"
              topLabel
              v-model="itemField.DIVISION"
              :items="codeList.division"
              item-title="TXT"
              item-value="COD"
              :disabled="isDisabled"
              :readonly="readOnlyValue.DIVISION"
              @update:modelValue="selectDivision"
              class="custom-flex-1"
              required
            />
            <i-input
              :label="$t('순번')"
              topLabel
              v-model="itemField.ITEM_SEQ"
              :readonly="readOnlyValue.ITEM_SEQ"
              :disabled="true"
              class="custom-flex-1"
            />
            <i-select
              :label="$t('품명')"
              topLabel
              v-model="itemField.ITEM_NAME"
              :items="codeList.itemName"
              item-title="TXT"
              item-value="COD"
              @update:menu="divisionValidation"
              class="custom-flex-1"
              required
            />
            <i-input
              :label="$t('모델명')"
              topLabel
              v-model="itemField.MODEL"
              class="custom-flex-1"
              required
            />
          </div>
          <div class="d-flex flex-gap mb-2 pt-2">
            <!-- <i-select
              :label="$t('납품업체')"
              topLabel
              v-model="itemField.VEND_SEQ"
              :items="codeList.VEND_SEQ"
              item-title="TXT"
              item-value="COD"
              class="custom-flex-1"
              required
            /> -->
            <i-input
              :label="$t('납품업체')"
              topLabel
              v-model="itemField.VEND"
              class="custom-flex-1"
              required
            />
            <i-input
              :label="$t('합격번호')"
              topLabel
              v-model="itemField.PASS_NO"
              class="custom-flex-1"
              required
            />
            <i-input
              :label="$t('자재번호')"
              topLabel
              v-model="itemField.MAT_NO"
              class="custom-flex-1"
              required
            />
            <i-input
              :label="$t('단가')"
              topLabel
              cost
              maxlength="13"
              v-model="formattedCost"
              class="custom-flex-1"
              required
            />
            <!-- "itemField.COST" -->
          </div>
          <div class="d-flex flex-gap mb-2">
            <i-input
              :label="$t('정렬순서')"
              topLabel
              number
              v-model="itemField.ORDER_NUM"
              class="custom-flex-1"
            />
            <i-select
              :label="$t('현재상태')"
              topLabel
              v-model="itemField.DELETE_YN"
              :items="codeList.YN"
              item-title="TXT"
              item-value="COD"
              class="custom-flex-1"
            />
            <i-textarea
              :label="$t('주의사항')"
              v-model="itemField.CAUTION"
              topLabel
              class="custom-flex-2"
              :row="1"
            />
          </div>
          <div class="d-flex flex-gap mb-2">
            <i-textarea
              :label="$t('비고')"
              v-model="itemField.REMARK"
              topLabel
              class="custom-flex-1"
              :row="4"
            />
          </div>
          <div class="d-flex flex-gap mb-2">
            <IUploadImageMulit
              ref="fileUpload1"
              style="width: 50%"
              title="제품사진"
              cnt="4"
              class="mr-2 custom-flex-1"
              @uploaded="uploadCheckPicture"
              :button-list="checkImageButton"
              :ref-image="refImage"
              image-sheet-width="50%"
              file-grid-width="50%"
            ></IUploadImageMulit>
          </div>
          <!-- @deleted="deletedCheckRefImage" -->
          <!-- @selectedRefImage="selectedCheckRefImage" -->

          <!-- <div class="d-flex title formLabelText">
            <label>사진</label>
          </div>
          <div class="d-flex flex-gap mb-2">
            <v-file-input
              v-model="imageField.files"
              :label="$t('여기에 파일을 끌어다 놓으세요.')"
              clearable
              class="file-flex"
              :append="false"
              @update:modelValue="selectFile"
            />
            <span class="file-flex"></span>
            
          </div>
          <div class="d-flex mb-2 image-container">
            <v-viewer class="image-item">
              <img
                :key="index"
                :src="imageField.images"
                class="viewer-img"
                style="cursor: pointer"
              />
            </v-viewer>
            <span class="image-item"></span>
          </div> -->
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.form-row {
  display: flex;
  flex-wrap: wrap; /* 요소가 넘치면 자동으로 줄 바꿈 */
  gap: 5px; /* 요소 간격 */
}

.custom-flex-1 {
  /* width: calc(25% - 0px) !important; */
  flex: 1 !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}

.custom-flex-2 {
  /* width: calc(25% - 0px) !important; */
  flex: 2 1 0 !important;
  flex-basis: calc(0% + 10px) !important;
  min-width: 0px !important;
  max-width: none !important;
  margin: 0 !important;
}

.image-flex {
  max-width: 100%;
  height: auto;
}

.file-flex {
  /* max-width: 50%; */
  flex: 1;
}

.flex-gap {
  gap: 10px;
}

.title {
  max-height: 20px;
  height: 20px;
  min-width: v-bind(labelWidth) !important;
  width: v-bind(labelWidth);
  justify-content: v-bind(justify);
  margin-right: v-bind(marginBetween) !important;
}

.image-container {
  display: flex;
  max-width: 100%;
  height: 300px;
  align-items: stretch;
  gap: 10px;
}
/* overflow: hidden; */

.image-item {
  flex: 1;
  width: 0;
  flex-basis: 0;
  height: 100%;
}
/* overflow: hidden; */

.image-item span {
  display: block;
  text-align: center;
  line-height: 300px;
}

.viewer-img {
  width: 100%;
  height: 100%;
}
</style>
