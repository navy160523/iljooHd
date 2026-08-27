<!-- 
  화면명   : S.O.M 등록/관리 팝업
  화면개요 : S.O.M 신규 등록 및 내용 수정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest3 } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonBigUploadFilesApi, commonDeletFilesApi } from "@hiway/api/commonFileApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"

import EmpPopup from "@/components/popup/EmpPopup.vue"
import SolutionDetail from '@/pages/40_safety-risk/SRM_D/Popup/SRMDA0020_popup02.vue'

// defineOptions({
//   name: "40_safety-risk-SRM_C-SRMCA0010",
// })

const vm = getCurrentInstance().proxy // 다이얼로그관련
const userStore = useUserStore()      // 유저정보
const commonStore = useCommonStore()  // 공통
const route = useRoute()              // 라우터
const t = useI18n().t                 // 다국어

const emit = defineEmits(['updated'])
const dialog = ref(false)
const grdMain1 = ref(null) // 사진 및 자료 첨부 그리드1
const grdMain2 = ref(null) // 사진 및 자료 첨부 그리드2
const grdSub = ref(null)  // 선행 제안 조회 그리드

const btnList = ref(['btnRegist'])  
const fileBtnList = ref(['btnCreate', 'btnDelete'])  
const isReadonly = ref(false)  

// 그리드 썸네일 표시 구분 변수
const grdThumbnail = ref('')

// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

// 캐러셀2
const carousel2 = ref(0)
const carouselIdx2 = ref(0)

const dummy = ref(null)
const dummy2 = ref(null)

const THUMBNAIL_FILE = ref(null)

// 팝업
const fileInput = ref(null)
const empPopup = ref(null)  // 인원 선택
const solutionDetail = ref(null)

const isLike = ref(false)
const isLikeColor = ref('black')

// v-model
const searchParams = reactive({
  TASK_NO: '',            // SOM 게시번호
  STATUS: '',             // 진행상태
  PROG_PERI_FROM: '',     // 공모기간(시작)
  PROG_PERI_TO: '',       // 공모기간(종료)
  DIFFICULTY: '',         // 난이도
  REWARD: '',             // 보상
  KEYWORD: '',            // 키워드
  RISK_NM: '',            // 제목
  CUR_PROB: '',           // 문제점
  REG_DT: '',             // 등록일자
  THUMBNAIL_FILE_ID: '',  // 썸네일 파일 ID
  IMG_FILE_ID1: '',       // 이미지 파일 ID
  HEART_CNT: '',          // 좋아요 수
	SEARCH_CNT: '',         // 조회수
  PEOPLE: '',             // 좋아하는놈들
})

// 저장 리스트
const saveParams = reactive({
  TASK_NO: '',
  CMPNY_DIV: userStore.cmpnyDiv,    // 회사
  BSNS_CD: userStore.bsnsCd,        // 사업부(코드)
  BSNS_NM: userStore.bsnsNm,        // 사업부(명)
  DEPT_CD: userStore.deptCd,        // 부서(코드)
  DEPT_NM: userStore.deptNm,        // 부서(명)
  SOLT_USER_ID: userStore.userId,   // 제보자(코드)
  SOLT_USER_NM: userStore.userName, // 제보자(명)
  SOLT_TITLE: '',                   // 제안명
  SOLT_CONTENTS: '',                // 내용 
  SOLT_DT: dayjs().format('YYYY-MM-DD'),  // 제안 등록일자 
  USER_ID: userStore.userId,
  SOLT_FILE_ID: '',                 // 이미지 파일 ID
})

const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  STATUS: [],
  DIFFICULTY: [],
  PRIZE: [
    { COD: 'A', TXT: '최우수' },
    { COD: 'B', TXT: '우수' },
    { COD: 'C', TXT: '장려' },
    { COD: 'D', TXT: '아차' },
    { COD: 'E', TXT: '아이디어 채택' }
  ]
})

// 파일 리스트
const fileList = reactive({
  src: [], 
  art: [],
  fileName: []
})

// 파일 리스트2
const fileList2 = reactive({
  src: [],
  art: [],
  fileName: []
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      },
    }),
    // 진행상태[2]
    getCodeList('HHIJJE09'),
    // 난이도[3]
    getCodeList('HHIJJC03')
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR
    codeList.DIFFICULTY = res[3].ORESULT_CUR
  })
}

// 그리드 셋팅(사진 및 자료 첨부)
const grdMainProps1 = reactive({
  gridViewOption : {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true }
  },
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'},
      renderer: {
        type: 'html',
        callback: function (grid, model, width, height) {
          let ret = ''

          if (model.value === grdThumbnail.value) {
            ret = `<div style='width: 100%;'>
                      <div style='width: 100%; display: flex;'>
                        <div class='ml-6'>
                          <span style='width: 50%; text-align: center;' class='text-red font-weight-bold'>(썸네일)</span>
                        </div>
                        <div style='width: 50%;'>
                          <p>${model.value}</p>
                        </div>
                      </div>
                    </div>
                  `
          } else {
            ret = model.value
          }
          return ret
        }, 
      },
    },

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
  ],
  columns : [],
})
grdMainProps1.columns = grdMainProps1.fields

// 그리드 셋팅(사진 및 자료 첨부)
const grdMainProps2 = reactive({
  gridViewOption : {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true }
  },
  keys : [],
  fields : [
    { fieldName: 'OPINION_CMPNY', dataType: 'text', header: { text: t('파일명'), styleName: 'header_color'} },

    { fieldName: 'FILE_ID', dataType: 'text', visible: false }, 
    { fieldName: 'FILE_NO', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'cnt', dataType: 'text', visible: false },
  ],
  columns : [],
})
grdMainProps2.columns = grdMainProps2.fields

// 그리드 셋팅(선행 제안 조회)
const grdSubProps = reactive({
  gridViewOption : {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: false },
    rowIndicator: { visible: false }
  },
  keys : [],
  fields : [
    { fieldName: 'SOLT_NO', dataType: 'text', width: '80', header: { text: t('제안번호') }},
    { fieldName: 'PRIZE', dataType: 'text', width: '80', header: { text: t('검토결과') },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.PRIZE },
      styleCallback: function(grid, dataCell) {
        let ret = { style: { background: '#FFFFFF' } }

        if (dataCell.value !== null && typeof dataCell.value !== 'undefined') {
          if (dataCell.value === 'A') {
            ret = { style: { background: '#FFC000' } }
          } else if (dataCell.value === 'B') {
            ret = { style: { background: '#BFBFBF' } }
          } else if (dataCell.value === 'C') {
            ret = { style: { background: '#CD7F32' } }
          } else if (dataCell.value === 'D') {
            ret = { style: { background: '#70AD47' } }
          } else if (dataCell.value === 'E') {
            ret = { style: { background: '#FFFFFF' } }
          }
        }
        return ret
      }
    },
    { fieldName: 'SOLT_TITLE', dataType: 'text', width: '200', header: { text: t('제안명') }, styleName: 'left-column' },
    { fieldName: 'SOLT_CONTENTS', dataType: 'text', width: '200', header: { text: t('내용') }, styleName: 'left-column' },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '160', header: { text: t('부서') }},
    { fieldName: 'SOLT_USER_NM', dataType: 'text', header: { text: t('제보자') }},
    { fieldName: 'SOLT_DT', dataType: 'text', header: { text: t('등록일자') },
      displayCallback: function (grd, idx, val) {
        return dayjs(val, 'YYYYMMDD').format('YYYY-MM-DD') 
      },
    },

    { fieldName: 'SAFE_OPI', dataType: 'text', visible: false },
    { fieldName: 'SOLT_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'SOLT_USER_ID', dataType: 'text', visible: false },
  ],
  columns : [],
})
grdSubProps.columns = grdSubProps.fields

// 팝업 오픈
const openPopup = async (popupParam, readonly) => {
  
  if(readonly){
    btnList.value = []
    fileBtnList.value = []
  }else {
    btnList.value = ['btnRegist']
    fileBtnList.value = ['btnCreate', 'btnDelete']
  }
  
  isReadonly.value = readonly

  dialog.value = true
  searchParams.TASK_NO = popupParam
  
  // 조회
  await searchData(searchParams.TASK_NO)
  
  // 조회수 증가 및 증가된 조회수 저장
  if (!searchParams.SEARCH_CNT) {
    searchParams.SEARCH_CNT = 1
  } else {
    searchParams.SEARCH_CNT++
  }
  await checkSearchCnt({ TASK_NO: searchParams.TASK_NO, SEARCH_CNT: searchParams.SEARCH_CNT}) 
  
  // 썸네일(배너) 출력
  await searchThumbnailImg(searchParams.THUMBNAIL_FILE_ID)
  
  // 파일 조회
  await fileSet(searchParams.IMG_FILE_ID1)
  
  // 좋아요 수가 없을 때
  if (!searchParams.HEART_CNT) {
    searchParams.HEART_CNT = 0
  } else {
    searchParams.HEART_CNT = searchParams.HEART_CNT
  }
}

// 팝업 닫기
const onClose = () => {
  emit('updated', searchParams.TASK_NO)
  dialog.value = false
}

// 조회
const searchData = async val => {
  const data = { 
    queryId: "SRMDA0010_POPUP_SEARCH_01", 
    param: { TASK_NO: val }
  }

  const meta = { useProgress: false }

  await commonRequest3("/hse/common/selectList", data, meta).then(async res => {
    // V-MODEL 바인딩
    for (let i in res.ORESULT_CUR1[0]) {
      searchParams[i] = res.ORESULT_CUR1[0][i]
    }

    // 날짜 format 설정
    searchParams.PROG_PERI_FROM = dayjs(searchParams.PROG_PERI_FROM, 'YYYYMMDD').format('YYYY-MM-DD')
    searchParams.PROG_PERI_TO = dayjs(searchParams.PROG_PERI_TO, 'YYYYMMDD').format('YYYY-MM-DD')

    saveParams.SOLT_DT = dayjs(saveParams.SOLT_DT, 'YYYYMMDD').format('YYYY-MM-DD')

    // 좋아요 색상
    if (!searchParams.PEOPLE) {
      isLikeColor.value = 'black'
    } else if (searchParams.PEOPLE.includes(userStore.userId)) {
      isLikeColor.value = 'primary'
    } else {
      isLikeColor.value = 'black' 
    }

    // 그리드 출력
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR2)

    await matchThumbnail()
  })
}

// 썸네일 표시
const matchThumbnail = async () => {
  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, //searchParams.CMPNY_DIV,
      FILE_ID: searchParams.THUMBNAIL_FILE_ID,
    },
  }).then(async (res) => {
    // 구분자 지정
    grdThumbnail.value = res.ORESULT_CUR[0].FILE_TITLE
  })
}

// 썸네일 이미지 출력
const searchThumbnailImg = async val => {
  await commonSearchApi({
    queryId: "searchFile",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: val
    } 
  }).then(async res => {
    await res.ORESULT_CUR.forEach(el => {
      commonDownloadFilesApi(el).then(res2 => {
        let blob = new Blob([res2])
        let imageURL = URL.createObjectURL(blob)

        let img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        THUMBNAIL_FILE.value = imageURL
      })
    })
  })
}

// 조회수 체크
const checkSearchCnt = async val => {
  await commonExecuteApi({
    queryId: 'SRMDA0010_POPUP_SAVE_02',
    list: [{
      TASK_NO: val.TASK_NO,
      SEARCH_CNT: val.SEARCH_CNT
    }]
  })
}

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnClose') {
    onClose()
  } else if (btn.id === 'btnRegist') {
    saveData()
  } else if (btn.id === 'btnDownLoad') {
    let chekedRow = grdMain1.value.getGridView().getCheckedRows()

    if (chekedRow.length === 0) {
      return Message.warn(t("선택된 데이터가 없습니다."))
    }

    downloadFile(chekedRow)
  } else if (btn.id === 'btnCreate') {
    fileInput.value.click()
  } else if (btn.id === 'btnDelete') {
    let chekedRow = grdMain2.value.getGridView().getCheckedRows()

    deleteFile(chekedRow)
  }
}

// 저장(등록)
const saveData = ()=> {
  if (!saveParams.SOLT_TITLE) {
    return Message.warn(t('제안명을 입력해주세요.')) 
  }

  if (!saveParams.SOLT_CONTENTS) {
    return Message.warn(t('제안 내용을 입력해주세요.')) 
  }

  saveParams.TASK_NO = searchParams.TASK_NO
  saveParams.SOLT_DT = saveParams.SOLT_DT.replaceAll('-', '')

  if (searchParams.STATUS === 'D' || searchParams.STATUS === 'E') { 
    return Message.warn(t('공모 종료된 게시물은 제안 등록을 할 수 없습니다.'))
  }

  vm.$swal({
    title: t('제안을 등록 하시겠습니까?'), 
    showCancelButton: true,
  }).then(ck => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'SRMDA0010_POPUP_SAVE_01', 
        list: [saveParams]
      }).then(res => {
        if (res.result.status === '200') {
          Message.success(t('등록 되었습니다.'))
          searchData(res.list[0].TASK_NO)
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        // 초기화
        saveParams.SOLT_TITLE = ''
        saveParams.SOLT_CONTENTS = ''
        saveParams.SOLT_FILE_ID = ''
        fileList2.src = []
        grdMain2.value.getDataProvider().setRows([])
      })
    }
  })
}

// 조회 이미지 세팅
const fileSet = async data => {
  grdMain1.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  await commonSearchApi({
    queryId: "searchFile", 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: data
    } 
  }).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        fileList.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdMain1.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV, 
        cnt: cnt
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName
        dummy.value = imageURL

      }).finally(() => {
        fileList.src[idx] = imageURL
        carousel.value++
        grdMain1.value.getGridView().checkAll(false)
        grdMain1.value.getGridView().resetCurrent()
      })
    })
  })
}

// 이미지 파일 다운로드 
const downloadFile = (idx) => {
  const currRow = grdMain1.value.getDataProvider().getJsonRow(idx)

  commonSearchApi({
    queryId: "searchFile",
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: currRow.FILE_ID
    } 
  }).then(res => {
    commonDownloadFilesApi(res.ORESULT_CUR[currRow.FILE_NO - 1]).then(res2 => {
      const file = res2.contentDisposition.split('fileName="')
      const blob = new Blob([res2])
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)
    })
    .catch(err => {
      return Message.err(err)
    })
  })
}

/* ---------- 이미지 신규 업로드 ---------- */
// 파일
const handleFileInputChange = e => {
  let file = e.target.files[0] 
  autoFileUpload(file)
}

// 파일 ID 생성
const create_UUID = () => {
  let dt = new Date().getTime();

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// 파일 자동 업로드
const autoFileUpload = async file => {
  if (!saveParams.SOLT_FILE_ID) {
    saveParams.SOLT_FILE_ID = create_UUID()
  }
  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize) 

  let currentChunk = 0

  // chunk size 만큼 데이터 분할
  const start = currentChunk * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const chunk = file.slice(start, end);

  // form data 형식으로 전송
  const formData = new FormData();

  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    FILE_ID: saveParams.SOLT_FILE_ID,
    FILE_NO: '',
    FILE_TITLE: file.name,
    FILE_NAME_ORIGINAL: file.name,
    FILE_NAME: file.name,
    FILE_PATH: `${commonStore.systemCode}${route.path}/`,
    FILE_TYPE: file.name.split(".").pop(),
    FILE_SIZE: Math.round(file.size / 1024.0),
    USER_ID: userStore.userId,
    CHUNK_NUMBER: currentChunk,
    TOTAL_CHUNKS: totalChunks
  }

  formData.append("file", chunk, file.name)
  formData.append(
    "param",
    new Blob([JSON.stringify(param)], { type: "application/json" })
  )
  
  await commonBigUploadFilesApi(formData).then(async res => {
    if (res.result.status === '200') {
      fileSet2(res.FILE_ID)
    }
  }).catch(err => {
    return Message.warn(err)
  })
}

const fileSet2 = data => {
  grdMain2.value.getDataProvider().setRows([])
  fileList2.src = []
  fileList2.fileName = []
  let cnt = 0

  commonSearchApi({
    queryId: "searchFile", 
    param: {
      CMPNY_DIV: userStore.cmpnyDiv, 
      FILE_ID: data
    } 
  }).then(async res => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach(e => {
      let type = e.FILE_TYPE.toUpperCase()
      if(type === 'PNG' || type === 'JPG' || type === 'JPEG' || type === 'GIF') {
        cnt++
        fileList2.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdMain2.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV, 
        cnt: cnt
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList2.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e).then(res2 => {
        contentDisposition = res2.contentDisposition
        fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

        blob = new Blob([res2])
        imageURL = URL.createObjectURL(blob)

        img = new Image() // 이미지 요소 생성

        img.src = imageURL // 이미지 URL 설정
        img.alt = fileName
        dummy2.value = imageURL

      }).finally(() => {
        fileList2.src[idx] = imageURL
        carousel2.value++
        grdMain2.value.getGridView().checkAll(false)
        grdMain2.value.getGridView().resetCurrent()
      })
    })
  })
}

// 이미지 파일 삭제
const deleteFile = () => {
  let deleteParams = []
  let chekedRow = grdMain2.value.getGridView().getCheckedRows()

  for (let i of chekedRow) {
    const data = grdMain2.value.getDataProvider().getJsonRow(i)

    data.CMPNY_DIV = userStore.cmpnyDiv

    deleteParams.push(data)
  }

  commonDeletFilesApi(deleteParams).then(res => {
    if (res.result.status === '200') {
      Message.success(t('삭제 되었습니다.'))
      saveParams.SOLT_FILE_ID = ''
      fileList2.src = []
      grdMain2.value.getDataProvider().setRows([])
    }
  })
}

/* ---------- 팝업 ---------- */
const selectEmp = () => {
  empPopup.value.openPopup({
    CMPNY_DIV: userStore.cmpnyDiv,
  })
}

const onselectEmp = val => {
  saveParams.BSNS_CD = val.BSNS_CD
  saveParams.BSNS_NM = val.BSNS_NM
  saveParams.DEPT_CD = val.ASGN_CD
  saveParams.DEPT_NM = val.ASGN_SHRT_NM
  saveParams.SOLT_USER_ID = val.EMP_NO
  saveParams.SOLT_USER_NM = val.EMP_NM
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange = async (grid, clickData) => {
  let rowData = await grdMain1.value.getDataProvider().getJsonRow(clickData.dataRow)
  carouselIdx.value = rowData.cnt - 1
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange2 = async (grid, clickData) => {
  let rowData = await grdMain2.value.getDataProvider().getJsonRow(clickData.dataRow)
  carouselIdx2.value = rowData.cnt - 1
}

// 좋아요
const onLike = async () => {
  const data = { 
    queryId: "SRMDA0010_SAVE_01", 
    list: [{
      TASK_NO: searchParams.TASK_NO,
      USER_ID: userStore.userId,
    }]
  }

  const meta = { useProgress: false }

  await commonRequest3("/hse/common/execute", data, meta).then(async res => {
    await searchData(res.list[0].TASK_NO)
  }).catch(err => {
    return Message.err(err) 
  })

  // commonExecuteApi({
  //   queryId: 'SRMDA0010_SAVE_01',
    // list: [{
    //   TASK_NO: searchParams.TASK_NO,
    //   USER_ID: userStore.userId,
    // }]
  // }).then(async res => {
  //   await searchData(res.list[0].TASK_NO)
  // }).catch(err => {
  //   return Message.err(err)
  // })
}

// 선행 제안 조회(상세보기)
const showSolutionDetail = (grid, clickData) => {
  let data = grdSub.value.getDataProvider().getJsonRow(clickData.dataRow)

  data.TASK_NO = searchParams.TASK_NO

  solutionDetail.value.openPopup(data)
}

// 나의 제안 보기
const searchMySolution = () => {
  commonSearchApi({
    queryId: 'SRMDA0020_POPUP_SEARCH_02',
    param: {
      TASK_NO: searchParams.TASK_NO,
      SOLT_USER_ID: userStore.userId
    }
  }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

// 전체 제안 보기
const searchAllSolution = data => {
  commonSearchApi({
    queryId: 'SRMDA0020_POPUP_SEARCH_02',
    param: {
      TASK_NO: typeof data !== 'String' ? searchParams.TASK_NO : data,
      SOLT_USER_ID: ''
    }
  }).then(res => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR) 
  })
}

const onSolutionDetail = val => {
  searchAllSolution(val)
}

onMounted(() => {
  initCodeList()
})

defineExpose({
  openPopup,
}) 
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
    height="900"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>공모 아이디어 제안 작성</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0 flex-column">
        <div class="d-flex justify-space-between">
          <div class="align-center">
            <!-- 좋아용  -->
            <v-icon 
              icon="mdi-thumb-up"
              :color="isLikeColor"
              class="likeIcon"
              @click="onLike"
            />
            <span class="ml-2">{{ searchParams.HEART_CNT }}</span>
            <!-- 눈팅수 -->
            <v-icon icon="mdi-eye" size="small" class="ml-2" />
            <span class="ml-2">{{ searchParams.SEARCH_CNT }}</span>
          </div>
          <div>
            <v-btn @click="onClose">닫기</v-btn>
          </div>
        </div>
      </v-card-title>
      <v-card-text class="pa-4 pt-2 content-area">
        <div class="d-flex flex-column fill-height">
          <!-- <v-sheet width="100%" v-if="searchParams.THUMBNAIL_FILE_ID">
            <v-img 
              height="250px"
              class="border"
              :src="THUMBNAIL_FILE"
            />
          </v-sheet> -->
          <v-sheet class="searchArea flex-column mt-0">
            <div class="d-flex">
              <i-input
                v-model="searchParams.TASK_NO"
                :label="$t('SOM 게시번호')"
                width="150px"
                topLabel
                readonly
              />
              <i-select
                v-model="searchParams.STATUS"
                :label="$t('진행상태')"
                width="150px"
                topLabel
                :items="codeList.STATUS"
                item-value="COD"
                item-title="TXT"
                readonly
              />
              <i-input
                v-model="searchParams.PROG_PERI_FROM"
                :label="$t('공모기간(시작)')"
                width="150px"
                topLabel
                readonly
                type="date"
              />
              <i-input
                v-model="searchParams.PROG_PERI_TO"
                :label="$t('공모기간(종료)')"
                width="150px"
                topLabel
                readonly
                type="date"
              />
              <i-select
                v-model="searchParams.DIFFICULTY"
                :label="$t('난이도')"
                width="150px"
                topLabel
                :items="codeList.DIFFICULTY"
                item-value="COD"
                item-title="TXT"
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.REWARD"
                :label="$t('보상')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="searchParams.KEYWORD"
                :label="$t('키워드')"
                width="490px"
                topLabel
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.RISK_NM"
                :label="$t('제목')"
                width="490px"
                topLabel
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-textarea
                v-model="searchParams.CUR_PROB"
                :label="$t('문제점')"
                width="490px"
                :row="3"
                topLabel
                readonly
              />
            </div>
          </v-sheet>
          <v-sheet class="pa-0">
            <IGridTitle
              :title="$t('사진 및 자료 첨부')"
              ref="gridTitle"
              :button-list="['btnDownLoad']" 
              @click-button="onButtonsClick"
            />
            <div class="d-flex fill-height">
              <v-sheet width="60%">
                <v-carousel 
                  hide-delimiters 
                  height="300px"
                  class="border"
                  show-arrows="hover"
                  hide-delimiter-background
                  :key="carousel"
                  v-model="carouselIdx"
                >
                  <v-carousel-item 
                    v-for="(item, i) in fileList.src"
                    :key="i"
                    :src="item"
                    width="584"
                  />
                </v-carousel>
              </v-sheet>
              <v-sheet class="h-auto ml-2">
                <RealGrid
                  ref="grdMain1"
                  class="border"
                  :grid-view-option="grdMainProps1.gridViewOption"
                  :keys="grdMainProps1.keys" 
                  :fields="grdMainProps1.fields"
                  :columns="grdMainProps1.columns"
                  @onCellClicked="imageChange"
                />
              </v-sheet>
            </div>
          </v-sheet>
          <v-sheet height="250px">
            <div class="d-flex justify-space-between align-center">
              <IGridTitle
                :title="$t('선행 제안 조회')"
                ref="gridTitle"
                class="mt-2"
              />
              <div class="d-flex">
                <v-btn @click="searchAllSolution">전체</v-btn>
                <v-btn @click="searchMySolution">나의 제안 조회</v-btn>
              </div>
            </div>
            <RealGrid
              ref="grdSub"
              :grid-view-option="grdSubProps.gridViewOption" 
              :keys="grdSubProps.keys" 
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"
              @onCellClicked="showSolutionDetail"
            />
          </v-sheet>
          <IGridTitle
            :title="$t('나의 제안 등록하기')"
            ref="gridTitle"
            class="mt-2"
            :button-list="btnList" 
            @click-button="onButtonsClick"
          />
          <v-sheet class="searchArea flex-column mt-0">
            <div class="d-flex">
              <i-select
                v-model="saveParams.CMPNY_DIV"
                :label="$t('회사')"
                width="150px"
                topLabel
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                readonly
              />
              <i-input
                v-model="saveParams.BSNS_NM"
                :label="$t('사업부')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="saveParams.DEPT_NM"
                :label="$t('부서')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="saveParams.SOLT_USER_NM"
                :label="$t('제보자')"
                width="150px"
                topLabel
                append-inner-icon="mdi-magnify"
                @click:appendInner="selectEmp"
                readonly
              />
              <i-input
                v-model="saveParams.SOLT_DT"
                :label="$t('등록일자')"
                width="150px"
                topLabel
                type="date"
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="saveParams.SOLT_TITLE"
                :label="$t('제안명')"
                width="490px"
                topLabel
                :readonly="isReadonly"
              />
            </div>
            <div class="d-flex mt-2">
              <i-textarea
                v-model="saveParams.SOLT_CONTENTS"
                :label="$t('내용')"
                width="490px"
                :row="3"
                topLabel
                :readonly="isReadonly"
              />
            </div>
          </v-sheet>
          <v-sheet class="pa-0 pb-2">
            <IGridTitle
              :title="$t('사진 및 자료 첨부')"
              ref="gridTitle"
              :button-list="fileBtnList" 
              @click-button="onButtonsClick"
            />
            <v-file-input style="display: none;" @change="handleFileInputChange" ref="fileInput"/> 
            <div class="d-flex fill-height">
              <v-sheet width="60%">
                <v-carousel 
                  hide-delimiters 
                  height="300px"
                  class="border"
                  show-arrows="hover"
                  hide-delimiter-background
                  :key="carousel2"
                  v-model="carouselIdx2"
                >
                  <v-carousel-item 
                    v-for="(item, i) in fileList2.src"
                    :key="i"
                    :src="item"
                    width="584"
                  />
                </v-carousel>
              </v-sheet>
              <v-sheet class="h-auto ml-2">
                <RealGrid
                  ref="grdMain2"
                  class="border"
                  :grid-view-option="grdMainProps2.gridViewOption"
                  :keys="grdMainProps2.keys" 
                  :fields="grdMainProps2.fields"
                  :columns="grdMainProps2.columns" 
                  @onCellClicked="imageChange2"
                />
              </v-sheet>
            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 담당자 선택 -->
  <EmpPopup ref="empPopup" @selected="onselectEmp" />

  <!-- 솔루션 제안 현황 팝업 -->
  <SolutionDetail ref="solutionDetail" @updated="onSolutionDetail"/>

</template>

<style scoped>

.likeIcon {
  font-size: x-large;
  transition: transform 0.3s ease;
  cursor: pointer;
}
.likeIcon:hover {
  transform: scale(1.2);
}

.v-card-title {
  position: sticky;
  top: 0;
  z-index: 1; /* 다른 내용 위에 표시될 수 있도록 설정 */
  background-color: white; /* 필요에 따라 배경색을 지정할 수 있습니다. */
}
</style>



