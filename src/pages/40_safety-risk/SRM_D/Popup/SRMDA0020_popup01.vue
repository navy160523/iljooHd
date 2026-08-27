<!-- 
  화면명   : S.O.M 등록/관리 팝업
  화면개요 : S.O.M 신규 등록 및 내용 수정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonSendApi,
} from '@hiway/api/commonApi'
import {
  commonDownloadFilesApi,
  commonBigUploadFilesApi,
  commonDeletFilesApi,
} from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { VWindow, VWindowItem } from 'vuetify/lib/components/index.mjs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import DiscriptRiskLevel from '@/pages/40_safety-risk/SRM_C/Popup/SRMCA0010_popup02.vue'
import SolutionDetail from '@/pages/40_safety-risk/SRM_D/Popup/SRMDA0020_popup02.vue'

// defineOptions({
//   name: "40_safety-risk-SRM_C-SRMCA0010",
// })

const vm = getCurrentInstance().proxy // 다이얼로그관련
const userStore = useUserStore() // 유저정보
const commonStore = useCommonStore() // 공통
const route = useRoute() // 라우터
const t = useI18n().t // 다국어

const emit = defineEmits(['updated'])
const dialog = ref(false)
const grdMain = ref(null) // 공모전 운영 정보 그리드
const grdSub = ref(null) // 사진 및 자료 첨부 그리드

// 캐러셀
const carousel = ref(0)
const carouselIdx = ref(0)

const dummy = ref(null)

// 그리드 썸네일 표시 구분 변수
const grdThumbnail = ref('')

// 팝업
const fileInput = ref(null)
const discriptRiskLevel = ref(null) // 위험등급 설명
const solutionDetail = ref(null)

// 관리자 권한
const isAdmin = ref(userStore.authGrpCd.includes('SRMAA001') ? true : false)
// const isAdmin = ref(userStore.authGrpCd.includes('GRP00291') ? true : false)

const existStatus = ref('') // 메일 발송 시 진행상태가 동일한지 판단
// v-model
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  BSNS_NM: '',
  DEPT_NM: '',
  REG_DT: dayjs().format('YYYY-MM-DD'),
  EMP_NO: '',
  EMP_NM: '',
  TASK_NO: '',
  TASK_SEQ: '', // 통합관리번호
  RISK_NM: '', // 제목(진행사항 제목)
  CUR_PROB: '', // 문제개요(진행사항 내용)
  CHECK_ACC: '', // 사고유형
  CHECK_ACC2: '', // 사고유형(기타(서술))
  GRADE: '', // 위험등급
  PROG_PERI_FROM: '', // 공모기간(시작)
  PROG_PERI_TO: '', // 공모기간(종료)
  STATUS: '', // 진행상태
  DIFFICULTY: '', // 난이도
  REWARD: '', // 보상
  KEYWORD: '', // 키워드
  DEPT_CD_IMP: '', // 담당부서
  DEPT_CD_REL: '', // 유관부서
  DEPT_NM_IMP: '', // 담당부서명
  DEPT_NM_REL: '', // 유관부서명
  IMG_FILE_ID1: '',
  THUMBNAIL_FILE_ID: '',
  REJECT_REASON: '', // 반려 사유
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  STATUS: [],
  GRADE: [],
  DIFFICULTY: [],
  CHECK_ACC: [],
  PRIZE: [
    { COD: 'A', TXT: '최우수' },
    { COD: 'B', TXT: '우수' },
    { COD: 'C', TXT: '장려' },
    { COD: 'D', TXT: '아차' },
    { COD: 'E', TXT: '아이디어 채택' },
  ],
})

const fileList = reactive({
  src: [],
  art: [],
  fileName: [],
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'N',
      },
    }),
    // 진행상태[2]
    getCodeList('HHIJJE09'),
    // 위험등급[3]
    getCodeList('HHIJJC01'),
    // 과제분류[4]
    getCodeList('HHIJJC03'),
    // 사고유형[5]
    getCodeList('HHIJJC11'),
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR
    codeList.GRADE = res[3].ORESULT_CUR
    codeList.DIFFICULTY = res[4].ORESULT_CUR
    codeList.CHECK_ACC = res[5].ORESULT_CUR
  })
}

// 그리드 속성셋팅(공모전 운영 정보)
const grdProps1 = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    stateBar: { visible: false },
    rowIndicator: { visible: false },
  },
  fields: [
    {
      fieldName: 'SOLT_NO',
      dataType: 'text',
      editable: false,
      width: '80',
      header: { text: t('제안번호') },
    },
    {
      fieldName: 'SOLT_TITLE',
      dataType: 'text',
      editable: false,
      width: '160',
      header: { text: t('제안명') },
      styleName: 'left-column',
    },
    {
      fieldName: 'PRIZE',
      dataType: 'text',
      editable: isAdmin.value ? true : false,
      width: '100',
      header: { text: t('등급'), styleName: 'header_validit' },
      lookupDisplay: true,
      lookupData: { value: 'COD', label: 'TXT', list: codeList.PRIZE },
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'SOLT_CONTENTS',
      dataType: 'text',
      editable: false,
      width: '180',
      header: { text: t('선정 내용') },
      styleName: 'left-column',
    },
    {
      fieldName: 'SAFE_OPI',
      dataType: 'text',
      editable: isAdmin.value ? true : false,
      width: '200',
      header: { text: t('비고(의견)'), styleName: 'header_validit' },
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      width: '160',
      header: { text: t('부서') },
    },
    {
      fieldName: 'SOLT_USER_NM',
      dataType: 'text',
      editable: false,
      width: '60',
      header: { text: t('제보자') },
    },
    {
      fieldName: 'SOLT_DT',
      dataType: 'text',
      editable: false,
      width: '90',
      header: { text: t('등록일자') },
      displayCallback: function (grd, idx, val) {
        return dayjs(val, 'YYYYMMDD').format('YYYY-MM-DD')
      },
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'SOLT_USER_ID', dataType: 'text', visible: false },
    { fieldName: 'SOLT_FILE_ID', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields

// 그리드 셋팅(사진 및 자료 첨부)
const grdProps2 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true },
  },
  keys: [],
  fields: [
    {
      fieldName: 'OPINION_CMPNY',
      dataType: 'text',
      header: { text: t('파일명'), styleName: 'header_color' },
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
  columns: [],
})
grdProps2.columns = grdProps2.fields

// 팝업 오픈
const openPopup = async(popupParam) => {
  initCodeList()
  dialog.value = true

  // 조회
  searchData(popupParam.TASK_NO)
}

// 썸네일 표시
const matchThumbnail = async () => {
  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: searchParams.THUMBNAIL_FILE_ID,
    },
  }).then(async (res) => {
    // 구분자 지정
    grdThumbnail.value = res.ORESULT_CUR[0].FILE_TITLE
  })
}

// 팝업 닫기
const onClose = () => {
  dialog.value = false
}

// 버튼 클릭 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    saveData()
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 버튼 클릭 이벤트2
const onButtonsClick2 = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(saveData2)
      .setAfter(() => {
        searchData(searchParams.TASK_NO)
      })
      .run()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  }
}

const saveData2 = () => {
  let saveList = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  for (let rowIdx of checkedRows) {
    let saveParams = {}

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    saveParams.PRIZE = data.PRIZE
    saveParams.SOLT_NO = data.SOLT_NO
    saveParams.SOLT_USER_ID = data.SOLT_USER_ID
    saveParams.TASK_NO = searchParams.TASK_NO
    saveParams.SAFE_OPI = data.SAFE_OPI

    saveList.push(saveParams)
  }

  commonExecuteApi({
    queryId: 'SRMDA0020_SAVE_04',
    list: saveList
  }).then(res => {
    if (res.result.status === '200') {
      autoMailSend()
    }
  })
}

// 삭제
const deleteData = () => {
  let deleteList = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if (checkedRows.length === 0) {
    return Message.warn('삭제할 데이터가 없습니다.')
  }

  for (let rowIdx of checkedRows) {
    let deleteParams = {}

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    deleteParams.SOLT_NO = data.SOLT_NO
    deleteParams.TASK_NO = searchParams.TASK_NO

    deleteList.push(deleteParams)
  }

  vm.$swal({
    title: t('삭제 하시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId: 'SRMDA0020_DELETE_01',
        list: deleteList,
      })
        .then((res) => {
          if (res.result.status === '200') {
            Message.success(t('삭제 되었습니다.'))
          }
        })
        .catch((err) => {
          return Message.err(err)
        })
        .finally(() => {
          searchData(searchParams.TASK_NO)
        })
    }
  })
}

// 파일 업로드 버튼 클릭 이벤트
const fileButtonsClick = (btn) => {
  let data = {}
  let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    data = grdSub.value.getDataProvider().getJsonRow(rowIdx)
  }

  if (btn.id === 'btnCreate') {
    fileInput.value.click()
  } else if (btn.id === 'btnThumbnail') {
    if (checkedRows.length === 0) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    if (checkedRows.length > 1) {
      return Message.warn(t('이미지는 하나만 선택해주세요.'))
    }

    // 새 FILE_ID 생성
    let newFileId = create_UUID()

    let saveParams = {
      CMPNY_DIV: data.CMPNY_DIV,
      EXIST_FILE_ID: data.FILE_ID,
      TASK_NO: searchParams.TASK_NO,
      FILE_ID: newFileId,
      FILE_NO: data.FILE_NO,
      USER_ID: userStore.userId,
    }

    // 기존 배너 삭제
    commonDeletFilesApi([
      {
        CMPNY_DIV: data.CMPNY_DIV,
        FILE_ID: searchParams.THUMBNAIL_FILE_ID,
        FILE_NO: 1,
      },
    ])

    commonExecuteApi({
      queryId: 'SRMDA0020_SAVE_03',
      list: [saveParams],
    }).then((res) => {
      if (res.result.status === '200') {
        Message.success(t('저장 되었습니다.'))
        searchData(searchParams.TASK_NO)
      }
    })
  } else if (btn.id === 'btnDelete') {
    let deleteParams = []

    let checkedRows = grdSub.value.getGridView().getCheckedRows(true)

    if (checkedRows.length === 0) {
      return Message.warn(t('선택된 데이터가 없습니다.'))
    }

    for (let rowIdx of checkedRows) {
      let data = grdSub.value.getDataProvider().getJsonRow(rowIdx)

      data.CMPNY_DIV = searchParams.CMPNY_DIV

      deleteParams.push(data)
    }

    vm.$swal({
      title: t('삭제 하시겠습니까?'),
      showCancelButton: true,
    }).then((ck) => {
      if (ck.isConfirmed === true) {
        // 썸네일 등록 확인 및 삭제 기능 추가
        deleteParams.forEach((item) => {
          // item.THUMBNAIL_FILE_ID = null
          item.THUMBNAIL_FILE_ID = searchParams.THUMBNAIL_FILE_ID
        })
        commonExecuteApi({
          queryId: 'SRMDA0020_CHECK_01',
          list: deleteParams,
        }).then(async (res) => {
          // 썸네일 등록 이미지면 썸네일도 같이 삭제
          await res.list.forEach(async (item) => {
            if (item.IS_THUMBNAIL === '1') {
              let result = await vm.$swal({
                title: t(
                  '[ ' +
                    item.FILE_NAME +
                    ' ] 는 썸네일로 등록 되어 있습니다. 삭제 하시겠습니까?'
                ),
                showCancelButton: true,
              })
              if (result.isConfirmed) {
                let params = [
                  {
                    CMPNY_DIV: item.CMPNY_DIV,
                    FILE_ID: item.FILE_ID,
                    FILE_NO: item.FILE_NO,
                  },
                  {
                    CMPNY_DIV: item.CMPNY_DIV,
                    FILE_ID: item.THUMBNAIL_FILE_ID,
                    FILE_NO: '1',
                  },
                ]
                commonDeletFilesApi(params).then(() => {
                  Message.success(t('삭제 되었습니다.'))
                  searchData(searchParams.TASK_NO)
                })
              }
            } else {
              let params = [
                {
                  CMPNY_DIV: item.CMPNY_DIV,
                  FILE_ID: item.FILE_ID,
                  FILE_NO: item.FILE_NO,
                },
              ]
              // 썸네일 등록 이미지 아니면 이미지만 삭제
              commonDeletFilesApi(params).then((res) => {
                Message.success(t('삭제 되었습니다.'))
              })
            }
          })

          searchData(searchParams.TASK_NO)
        })
      }
    })
  }
}

// 조회
const searchData = (data) => {
  Promise.all([
    commonSearchApi({
      queryId: 'SRMDA0020_POPUP_SEARCH_01',
      param: { TASK_NO: data },
    }),
    commonSearchApi({
      queryId: 'SRMDA0020_POPUP_SEARCH_02',
      param: { TASK_NO: data },
    }),
  ]).then(async (res) => {
    // res[0]
    for (let i in res[0].ORESULT_CUR[0]) {
      if (i === 'CHECK_ACC') {
        let array = res[0].ORESULT_CUR[0][i]
          ? res[0].ORESULT_CUR[0][i].split(',')
          : []
        searchParams[i] = array
      } else {
        searchParams[i] = res[0].ORESULT_CUR[0][i]
      }
    }

    // 날짜 포맷 세팅
    searchParams.REG_DT = dayjs(searchParams.REG_DT).format('YYYY-MM-DD')
    searchParams.PROG_PERI_FROM = dayjs(searchParams.PROG_PERI_FROM).format(
      'YYYY-MM-DD'
    )
    searchParams.PROG_PERI_TO = dayjs(searchParams.PROG_PERI_TO).format(
      'YYYY-MM-DD'
    )

    existStatus.value = searchParams.STATUS

    // 이미지 파일 세팅
    fileSet(searchParams.IMG_FILE_ID1)

    // res[1]
    grdMain.value.getDataProvider().setRows(res[1].ORESULT_CUR)

    await matchThumbnail() 
  })
}

// 저장
const saveData = async () => {
  let saveParams = {}

  let mailParams = {} // 진행상태 : 초안접수(A) 또는 S.O.M 반려(H) 일 때 제보자에게 메일 전송

  for (let i in searchParams) {
    saveParams[i] = searchParams[i]
  }

  saveParams.CHECK_ACC = searchParams.CHECK_ACC.join(',')
  saveParams.PERI_FROM = searchParams.PROG_PERI_FROM
  saveParams.PERI_TO = searchParams.PROG_PERI_TO

  // 키워드 마지막 문장에 ','가 입력되면 제거
  saveParams.KEYWORD = searchParams.KEYWORD
    ? searchParams.KEYWORD.replace(/^,+|,+$/g, '')
    : searchParams.KEYWORD

  // 진행상태가 반려가 아닌 것(수용)
  if (searchParams.STATUS !== 'H' || searchParams.STATUS !== 'A') {
    mailParams.SUBJECT = '[안전 아이디어 장터] 공모주제 검토 결과 - 수용'
    mailParams.CONTENT = `
    <div style="text-align: center;">
      <div>
        <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전 아이디어장터</span>
        <br/>
        <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Open Market”</span>
        <br/><br/>
        <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">공모주제 주제 결과</span>
      </div>
      <div style="margin-top: 12px;">
        <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td height="3" bgcolor="#76FF03"></td>
          </tr>
        </table>
      </div>
      <div>
        <img 
          width="308"
          height="446" 
          src="http://10.25.17.129:5173/src/assets/images/hiro/04.gif"
          alt="Safety Image"
        />
      </div>
      <div>
        <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
          귀하의 ${searchParams.TASK_NO} 안전RISK 관련, 안전 아이디어 장터 공모주제 제안은 아래와 같이 검토되었습니다.
          <br/>
          <br/>검토 결과: 수용
          <br/>
          <br/>안전 아이디어 등록번호: ${searchParams.TASK_NO}
          <br/>귀하께서 안전 아이디어 장터를 통해 보여주신 안전개선에 대한 관심에 깊은 감사를 표합니다. 
          <br/>향후에도 추가 공모 주제와 아이디어 솔루션 제안들에 대하여 관심과 함께 지켜봐 주시고, 귀하의 우수한 아이디어를 다시 한번 기다리겠습니다. 
          <br/>
          <br/>안전 아이디어 장터 담당자 안전경영부 유승훈 매니저 (2-3613)
        </span>
      </div>
      <div style="margin-top: 16px;">
        <img 
          width="180" 
          height="50" 
          src="http://10.25.17.129:5173/src/assets/images/ci/HHI_color_ko.png"
          alt="HHI Logo"
        />
        <img 
          width="180" 
          height="50" 
          src="http://10.25.17.129:5173/src/assets/images/ci/SRM.png"
          alt="SRM Logo"
        />
      </div>
    </div>
    `
    mailParams.EMAIL = []

    // 리스크 제보자
    commonSearchApi({
      queryId: 'SRMDA0020_SEARCH_03',
      param: { EMP_NO: searchParams.EMP_NO },
    }).then(res => {
      for (let i of res.ORESULT_CUR) {
        mailParams.EMAIL.push(i.EMAIL)    
      }
    })

    // SRM추진과 담당
    mailParams.EMAIL.push('hhi.srm@hd.com')
  }

  // 진행상태 반려일 경우
  if (searchParams.STATUS === 'H') {
    // 진행상태 : S.O.M 반려(H) 일 때 "반려 사유"를 반드시 입력
    if (!searchParams.REJECT_REASON) {
      return Message.warn(t('반려 사유를 입력해주세요.'))
    }

    // TODO: 안전담당 관리자들 사번필요 차후 적용예정(2024.07.03)

    // 공모전 운영정보 그리드 데이터 제보자ID 가져오기
    const allData = grdMain.value.getDataProvider().getJsonRows()

    mailParams.EMAIL = []

    // 제안자 이메일
    for (let i of allData) {
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_03',
        param: { EMP_NO: i.SOLT_USER_ID },
      }).then(res => {
        for(let i of res.ORESULT_CUR) {          
          mailParams.EMAIL.push(i.EMAIL)
        }
      })
    }

    // 담당부서, 유관부서장, 작성자 이메일
    await Promise.all([
      // 담당부서
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_02',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          DEPT_CD: searchParams.DEPT_CD_IMP,
        },
      }),
      // 유관부서
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_02',
        param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          DEPT_CD: searchParams.DEPT_CD_REL,
        },
      }),
      // 작성자 이메일
      commonSearchApi({
        queryId: 'SRMDA0020_SEARCH_03',
        param: { EMP_NO: searchParams.EMP_NO },
      })
    ]).then((res) => {
      for (let imp of res[0].ORESULT_CUR) {
        mailParams.EMAIL.push(imp.EMAIL)
      }

      for (let rel of res[1].ORESULT_CUR) {
        mailParams.EMAIL.push(rel.EMAIL)
      }

      for (let emp of res[2].ORESULT_CUR) {
        mailParams.EMAIL.push(emp.EMAIL)
      }

      mailParams.EMAIL.push('hhi_ssm@hd.com') // SRM 추진과 메일
    })

    mailParams.SUBJECT = '[안전 아이디어 장터] 공모주제 검토 결과 - 반려'
    mailParams.CONTENT = `
      <div style="text-align: center;">
        <div>
          <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전 아이디어장터</span>
          <br/>
          <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Open Market”</span>
          <br/><br/>
          <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">공모주제 반려</span>
        </div>
        <div style="margin-top: 12px;">
          <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td height="3" bgcolor="#76FF03"></td>
            </tr>
          </table>
        </div>
        <div>
          <img 
            width="308"
            height="446" 
            src="http://10.25.17.129:5173/src/assets/images/hiro/06.gif"
          />
        </div>
        <div>
          <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
            귀하의 <b>${searchParams.TASK_NO}</b> 안전 RISK 관련, 안전 아이디어 장터 공모주제 제안은 아래와 같이 검토되었습니다.
            <br/>
            <br/>
            <b>검토 결과: 반려</b>
            <br/>
            <br/>
            비록 귀하의 소중한 아이디어가 채택되지 않았으나, <br/>안전 아이디어 장터를 통해 보여주신 안전개선에 대한 관심에 깊은 감사를 표합니다.<br/>
            SRM추진과는 귀하의 제안을 바탕으로 향후에도 추가적으로 검토하겠습니다.<br/>
            앞으로도 제보되는 안전RISK들에 대해서도 관심과 함께 지켜봐 주시고, <br/>귀하의 우수한 아이디어를 다시 한번 기다리겠습니다. 
            <br/>
            <br/>
            ${dayjs().format('YYYY')}년 ${dayjs().format('MM')}월 ${dayjs().format('DD')}일<br/>
            안전 아이디어 장터 담당자 안전경영부 유승훈 매니저 (2-3613)
          </span>
        </div>
        <div style="margin-top: 16px">
          <img 
              width="180" 
              height="50" 
              src="http://10.25.17.129:5173/src/assets/images/ci/HHI_color_ko.png"
          />
          <img 
              width="180" 
              height="50" 
              src="http://10.25.17.129:5173/src/assets/images/ci/SRM.png"
          />
        </div>
      </div>
    `
  }

  vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      commonExecuteApi({
        queryId: 'SRMDA0020_SAVE_01',
        list: [saveParams],
      }).then(async (res) => {
        if (res.result.status === '200') {
          // 진행상태 : 초안접수(A) 또는 S.O.M 반려(H) 일 때 제보자 메일 발송
          if (existStatus.value !== searchParams.STATUS) {
            await commonSendApi(mailParams)
          }

          Message.success(t('저장 되었습니다.')) // 저장 알림

          searchData(searchParams.TASK_NO) // 재조회
        }
      })
    }
  })
}

// 파일
const handleFileInputChange = (e) => {
  let file = e.target.files[0]
  autoFileUpload(file)
}

// 파일 ID 생성
const create_UUID = () => {
  let dt = new Date().getTime()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const autoFileUpload = (file) => {
  if (!searchParams.IMG_FILE_ID1) {
    searchParams.IMG_FILE_ID1 = create_UUID()

    somFileUpload()
  }
  // 자르는 사이즈
  let chunkSize = 1024 * 1024 // 1MB
  // total size 계산
  let totalChunks = Math.ceil(file.size / chunkSize)
  initCodeList()
  let currentChunk = 0

  // chunk size 만큼 데이터 분할
  const start = currentChunk * chunkSize
  const end = Math.min(start + chunkSize, file.size)
  const chunk = file.slice(start, end)

  // form data 형식으로 전송
  const formData = new FormData()

  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    FILE_ID: searchParams.IMG_FILE_ID1,
    FILE_NO: '',
    FILE_TITLE: file.name,
    FILE_NAME_ORIGINAL: file.name,
    FILE_NAME: file.name,
    FILE_PATH: `${commonStore.systemCode}${route.path}/`,
    FILE_TYPE: file.name.split('.').pop(),
    FILE_SIZE: Math.round(file.size / 1024.0),
    USER_ID: userStore.userId,
    CHUNK_NUMBER: currentChunk,
    TOTAL_CHUNKS: totalChunks,
  }

  formData.append('file', chunk, file.name)
  formData.append(
    'param',
    new Blob([JSON.stringify(param)], { type: 'application/json' })
  )

  commonBigUploadFilesApi(formData)
    .then((res) => {
      fileSet(res.FILE_ID)
    })
    .catch((err) => {
      return Message.warn(err)
    })
}

const fileSet = (data) => {
  grdSub.value.getDataProvider().setRows([])
  fileList.src = []
  fileList.fileName = []
  let cnt = 0

  commonSearchApi({
    queryId: 'searchFile',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      FILE_ID: data,
    },
  }).then(async (res) => {
    /* ********** IMAGE 파일만 따로 분리 ********** */
    await res.ORESULT_CUR.forEach((e) => {
      let type = e.FILE_TYPE.toUpperCase()
      if (
        type === 'PNG' ||
        type === 'JPG' ||
        type === 'JPEG' ||
        type === 'GIF'
      ) {
        cnt++
        fileList.fileName.push(e)
      }
      /* ********** grid row 추가 ********** */
      grdSub.value.addRow({
        OPINION_CMPNY: e.FILE_TITLE,
        FILE_ID: e.FILE_ID,
        FILE_NO: e.FILE_NO,
        CMPNY_DIV: e.CMPNY_DIV,
        cnt: cnt,
      })
    })

    /* ********** IMAGE 파일 다운로드 및 URL 변경 ********** */
    fileList.fileName.forEach((e, idx) => {
      let contentDisposition = null
      let fileName = null
      let blob = null
      let imageURL = null
      let img = new Image() // 이미지 요소 생성

      commonDownloadFilesApi(e)
        .then((res2) => {
          contentDisposition = res2.contentDisposition
          fileName = contentDisposition.match(/fileName="([^"]+)"/)[1]

          blob = new Blob([res2])
          imageURL = URL.createObjectURL(blob)

          img = new Image() // 이미지 요소 생성

          img.src = imageURL // 이미지 URL 설정
          img.alt = fileName
          dummy.value = imageURL
        })
        .finally(() => {
          fileList.src[idx] = imageURL
          carousel.value++
          grdSub.value.getGridView().checkAll(false)
          grdSub.value.getGridView().resetCurrent()
        })
    })
  })
}

// S.O.M 이미지 파일 업로드
const somFileUpload = (data) => {
  let uploadParams = {
    TASK_NO: searchParams.TASK_NO,
    FILE_ID: searchParams.IMG_FILE_ID1,
  }

  commonExecuteApi({
    queryId: 'SRMDA0020_SAVE_02',
    list: [uploadParams],
  }).then((res) => {
    if (res.result.status === '200') {
      Message.success(t('저장 되었습니다.'))
      searchData(searchParams.TASK_NO)
    }
  })
}

/* 그리드 파일명 선택시 해당 파일 이미지로 변경 */
const imageChange = async (grid, clickData) => {
  let rowData = await grdSub.value
    .getDataProvider()
    .getJsonRow(clickData.dataRow)
  carouselIdx.value = rowData.cnt - 1
}

// 공모전 운영 정보 그리드 셀 클릭 이벤트
const onCellClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  data.TASK_NO = searchParams.TASK_NO

  if (
    clickData.cellType !== 'check' &&
    clickData.fieldIndex !== 2 &&
    clickData.fieldIndex !== 4
  ) {
    solutionDetail.value.openPopup(data)
  }
}

// 공모전 운영 정보 등급 선정 시 자동 메일 발송
const autoMailSend = async () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  for (let rowIdx of checkedRows) {
    const data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    let resultPrize = codeList.PRIZE.find(item => item.COD === data.PRIZE)

    let mailParams = {
      EMAIL: [],
      SUBJECT: 'SOM 솔루션 제안 포상 선정',
      CONTENT: `
        <div style="text-align: center;">
          <div>
            <span style="font-size:14.0pt;font-family:'HD현대체 Medium',serif;color:#002554">안전 아이디어장터</span>
            <br/>
            <span style="font-size:22.0pt;font-family:'HD현대체 Bold',serif;color:#FDB813">“Safety Open Market”</span>
            <br/><br/>
            <span style="font-size:16.0pt;font-family:'HD현대체 Bold',serif;color:#002554">[안전 아이디어 장터] 솔루션 제안 채택</span>
          </div>
          <div style="margin-top: 12px;">
            <table width="500" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td height="3" bgcolor="#76FF03"></td>
              </tr>
            </table>
          </div>
          <div>
            <img 
              width="308"
              height="446" 
              src="http://10.25.17.129:5173/src/assets/images/hiro/04.gif"
            />
          </div>
          <div>
            <span style="font-size:12.0pt;line-height:115%;font-family:'HD현대체 Medium',serif;color:#002554">
              귀하의 <b>${searchParams.TASK_NO}</b>번 "${data.SOLT_TITLE}" 안전 아이디어 장터 공모주제 제안은 아래와 같이 검토되었습니다.
              <br/>
              <br/>
              <b>검토 결과: ${resultPrize.TXT}</b>                            
              <br/>
              <b>안전 의견: ${data.SAFE_OPI}</b> (HD안전페이를 통하여 지급 예정)
              <br/>
              <br/>
              귀하께서 안전 아이디어 장터를 통해 보여주신 안전개선에 대한 관심에 깊은 감사를 표합니다.<br/>
              향후에도 추가 공모 주제와 아이디어 솔루션 제안들에 대하여 관심과 함께 지켜봐 주시고, 귀하의 우수한 아이디어를 다시 한번 기다리겠습니다.<br/> 
              <br/>
              <br/>
              ${dayjs().format('YYYY')}년 ${dayjs().format('MM')}월 ${dayjs().format('DD')}일<br/>
              안전 아이디어 장터 담당자 안전경영부 유승훈 매니저 (2-3613)
            </span>
          </div>
          <div style="margin-top: 16px">
            <img 
                width="180" 
                height="50" 
                src="http://10.25.17.129:5173/src/assets/images/ci/HHI_color_ko.png"
            />
            <img 
                width="180" 
                height="50" 
                src="http://10.25.17.129:5173/src/assets/images/ci/SRM.png"
            />
          </div>
        </div>
      `
    }

    // 이메일 가져오기(소속 부서장)
    await commonSearchApi({
      queryId: 'SRMAA0040_SEARCH_03', 
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        DEPT_CD: data.DEPT_CD
      } 
    }).then (res => {
      res.ORESULT_CUR.forEach(item => {
        if (item.OFFI_RES_CD === '62') {
          mailParams.EMAIL.push(item.EMAIL)
        }
      })
    })

    // 이메일 가져오기(제안자)
    for (let i of [searchParams.EMP_NO, data.SOLT_USER_ID]) {
      await commonSearchApi({ 
        queryId: 'searchEMP', 
        param: {
          FLAG: 'N',
          EMP_NO: i
        } 
      }).then(res => {
        mailParams.EMAIL.push(res.ORESULT_CUR[0].EMAIL)
      })
    }

    
    await commonSendApi(mailParams).then((res) => {
      Message.success(t('메일이 전송되었습니다.'))
    })
  }
}

// 키워드 공백 처리
watch(
  () => searchParams.KEYWORD, (newValue, oldValue) => {
    // 공백 확인
    const spaceCheck = /\s/g
    // 특수문자 확인
    const charCheck =
      /[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uAC01-\uD7A3a-zA-Z0-9,]/g

    // 공백 제거
    if (newValue.match(spaceCheck)) {
      return (searchParams.KEYWORD = newValue.replaceAll(spaceCheck, ','))
    }

    // 특수문자 제거
    if (newValue.match(charCheck)) {
      return (searchParams.KEYWORD = newValue.replaceAll(charCheck, ''))
    }

    // 콤마(,)가 2개 이상 작성되면 삭제
    while (newValue.includes(',,')) {
      return (searchParams.KEYWORD = newValue.replaceAll(',,', ','))
    }
  }
)

// 위험작업 설명
const onHelp = () => {
  discriptRiskLevel.value.openPopup()
}

onMounted(() => {})

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
      <span>공모 아이디어 관리</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0 flex-column">
        <IMenuTitle
          ref="menuTitle"
          :title="$t('공모주제 내용')"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-2 py-0 content-area">
        <div class="flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.REG_DT"
                :label="$t('등록일자')"
                width="150px"
                topLabel
                type="date"
                readonly
              />
              <i-input
                v-model="searchParams.TASK_SEQ"
                :label="$t('통합관리번호')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="searchParams.TASK_NO"
                :label="$t('접수번호')"
                width="150px"
                topLabel
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.CMPNY_DIV"
                :label="$t('회사명')"
                width="150px"
                topLabel
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                readonly
              />
              <i-input
                v-model="searchParams.BSNS_NM"
                :label="$t('사업부')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="searchParams.DEPT_NM"
                :label="$t('부서')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="searchParams.EMP_NM"
                :label="$t('제보자')"
                width="150px"
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
                :label="$t('문제개요')"
                width="490px"
                :row="2"
                topLabel
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="searchParams.CHECK_ACC"
                width="490px"
                :label="$t('사고유형')"
                :items="codeList.CHECK_ACC"
                item-title="TXT"
                item-value="COD"
                multiple
                close-on-item-click="false"
                readonly
                topLabel
              />
              <i-input
                v-model="searchParams.CHECK_ACC2"
                width="490px"
                :label="$t('기타(서술)')"
                topLabel
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.DEPT_NM_IMP"
                :label="$t('담당부서')"
                width="150px"
                topLabel
                readonly
              />
              <i-input
                v-model="searchParams.DEPT_NM_REL"
                :label="$t('유관부서')"
                width="150px"
                topLabel
                readonly
              />
              <!-- 위험등급 -->
              <v-sheet width="170px" class="mr-0 mb-1">
                <div class="formLabelText">
                  {{ $t('위험등급') }}
                  <v-icon
                    icon="mdi-help-circle-outline"
                    size="small"
                    color="#6e6e6e"
                    @click="onHelp"
                  />
                </div>
                <div class="d-flex align-center" style="width: 100%">
                  <i-select
                    v-model="searchParams.GRADE"
                    width="150px"
                    :items="codeList.GRADE"
                    item-value="COD"
                    item-title="TXT"
                    readonly
                  />
                </div>
              </v-sheet>
            </div>
          </v-sheet>
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-input
                v-model="searchParams.PROG_PERI_FROM"
                :label="$t('공모기간(시작)')"
                width="150px"
                topLabel
                type="date"
              />
              <i-input
                v-model="searchParams.PROG_PERI_TO"
                :label="$t('공모기간(종료)')"
                width="150px"
                topLabel
                type="date"
              />
              <i-select
                v-model="searchParams.STATUS"
                :label="$t('진행상태')"
                width="150px"
                topLabel
                :items="codeList.STATUS"
                item-value="COD"
                item-title="TXT"
              />
              <!-- 진행상태가 "S.O.M 반려" 일 때 "반려 사유" 출력 -->
              <i-input
                v-if="searchParams.STATUS === 'H'"
                v-model="searchParams.REJECT_REASON"
                :label="$t('반려 사유')"
                width="400px"
                topLabel
              />
              <!-- 진행상태가 "S.O.M 반려"가 아닐 경우 상단에서 유지 -->
              <i-select
                v-if="searchParams.STATUS !== 'H'"
                v-model="searchParams.DIFFICULTY"
                :label="$t('난이도')"
                width="150px"
                topLabel
                :items="codeList.DIFFICULTY"
                item-value="COD"
                item-title="TXT"
              />
              <i-input
                v-if="searchParams.STATUS !== 'H'"
                v-model="searchParams.REWARD"
                :label="$t('보상')"
                width="150px"
                topLabel
                suffix="(원)"
              />
            </div>
            <!-- 진행상태가 "S.O.M 반려" 일 때 하단으로 이동 -->
            <div v-if="searchParams.STATUS === 'H'" class="d-flex mt-2">
              <i-select
                v-model="searchParams.DIFFICULTY"
                :label="$t('난이도')"
                width="150px"
                topLabel
                :items="codeList.DIFFICULTY"
                item-value="COD"
                item-title="TXT"
              />
              <i-input
                v-model="searchParams.REWARD"
                :label="$t('보상')"
                width="150px"
                topLabel
                suffix="(원)"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="searchParams.KEYWORD"
                :label="$t('키워드')"
                width="490px"
                topLabel
                maxlength="50"
              />
            </div>
          </v-sheet>
          <v-sheet class="pa-0">
            <IGridTitle
              :title="$t('사진 및 자료 첨부')"
              ref="gridTitle"
              :button-list="['btnThumbnail', 'btnCreate', 'btnDelete']"
              @click-button="fileButtonsClick"
            />
            <v-file-input
              style="display: none"
              @change="handleFileInputChange"
              ref="fileInput"
            />
            <div class="d-flex fill-height">
              <v-sheet width="60%">
                <!-- v-if="fileList.src.length > 0" -->
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
                  ref="grdSub"
                  class="border"
                  :grid-view-option="grdProps2.gridViewOption"
                  :keys="grdProps2.keys"
                  :fields="grdProps2.fields"
                  :columns="grdProps2.columns"
                  @onCellClicked="imageChange"
                />
              </v-sheet>
            </div>
          </v-sheet>
          <v-sheet class="my-2" height="250px">
            <IMenuTitle
              ref="menuTitle"
              :title="$t('공모전 운영 정보')"
              :button-list="isAdmin === true ? ['btnUpdate', 'btnDelete'] : []"
              @click-button="onButtonsClick2"
            />
            <RealGrid
              ref="grdMain"
              class="mt-0 mb-2"
              :grid-view-option="grdProps1.gridViewOption"
              :keys="grdProps1.keys"
              :fields="grdProps1.fields"
              :columns="grdProps1.columns"
              :column-layout="grdProps1.columnLayout"
              @onCellClicked="onCellClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>

    <!-- 솔루션 제안 현황 팝업 -->
    <SolutionDetail ref="solutionDetail" />

    <!-- 위험등급 설명 -->
    <DiscriptRiskLevel ref="discriptRiskLevel" />
  </v-dialog>
</template>
<style scoped>
.v-card-title {
  position: sticky;
  top: 0;
  z-index: 1; /* 다른 내용 위에 표시될 수 있도록 설정 */
  background-color: white; /* 필요에 따라 배경색을 지정할 수 있습니다. */
}
</style>
