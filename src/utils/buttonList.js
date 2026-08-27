import _ from 'lodash'

const initButtonItems = (arrButtonId) => {
  let buttonIdList = [...arrButtonId]
  let buttonItems = new Array()

  buttonIdList.forEach((buttonId) => {
    let item = defaultButtonList.find((item) => item.id === buttonId)
    if (item) buttonItems.push(_.cloneDeep(item))
  })

  //console.log(buttonItems)

  return buttonItems
}

export default initButtonItems

let defaultButtonList = [
  //**메인*******************/
  //메인그리드 조회
  {
    id: 'btnSearch',

    //icon: 'mdi-magnify',
    text: 'btn.Search',
    disable: false,
    visible: true,
  },

  //메인그리드 추가
  {
    id: 'btnCreate',

    //icon: 'mdi-plus-circle',
    text: 'btn.Add',
    disable: false,
    visible: true,
  },

  //메인그리드 저장
  {
    id: 'btnUpdate',

    //icon: 'mdi-content-save',
    text: 'btn.Save',
    disable: false,
    visible: true,
  },

  // HD안전페이 unknown 건 조회
  {
    id: 'btnShowUnknown',

    //icon: 'mdi-content-save',
    text: 'btn.ShowUnknown',
    disable: false,
    visible: true,
    permission: true,
  },

  //메인그리드 삭제
  {
    id: 'btnDelete',

    //icon: 'mdi-delete',
    text: 'btn.Delete',
    disable: false,
    visible: true,
  },

  //출력
  {
    id: 'btnPrint',

    //icon: 'mdi-printer',
    text: 'btn.Print',
    disable: false,
    visible: true,
  },

  //리포트 출력
  {
    id: 'btnPrintReport',

    //icon: 'mdi-printer',
    text: 'btn.PrintReport',
    disable: false,
    visible: true,
  },

  //전체 목록 추출
  {
    id: 'btnPrintAllList',

    //icon: 'mdi-printer',
    text: 'btn.PrintAllList',
    disable: false,
    visible: true,
  },

  //결재상신
  {
    id: 'btnReqApply',
    //icon: 'mdi-check-circle-outline',
    text: 'btn.ReqApply',
    disable: false,
    visible: true,
    permission: true,
  },

  //결재
  {
    id: 'btnApply',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.Apply',
    disable: false,
    visible: true,
  },

  //결재취소
  {
    id: 'btnApplyCancel',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.ApplyCancel',
    disable: false,
    visible: true,
  },

  //결재승인
  {
    id: 'btnApplyApprove',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.ApplyApprove',
    disable: false,
    visible: true,
  },

  //결재반려
  {
    id: 'btnApplyTurnBack',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.ApplyTurnBack',
    disable: false,
    visible: true,
  },

  //**메인*******************/

  /**팝업*******************/
  //팝업 선택
  {
    id: 'btnSelect',

    //icon: 'mdi-check-bold',
    text: 'btn.Select',
    disable: false,
    visible: true,
    permission: true,
  },

  //팝업 닫기
  {
    id: 'btnClose',

    //icon: 'mdi-close-box-outline',
    text: 'btn.Close',
    disable: false,
    visible: true,
    permission: true,
  },

  //팝업 닫기
  {
    id: 'btnCancel',

    //icon: 'mdi-close-box-outline',
    text: 'btn.Cancel',
    disable: false,
    visible: true,
    permission: true,
  },

  //**팝업*******************/

  /**서브*******************/
  //서브그리드 조회
  {
    id: 'btnSearch2',

    //icon: 'mdi-magnify',
    text: 'btn.Search',
    disable: false,
    visible: true,
    permission: true,
  },

  //서브그리드 추가
  {
    id: 'btnCreate2',

    //icon: 'mdi-plus-circle',
    text: 'btn.Add',
    disable: false,
    visible: true,
  },

  //서브그리드 저장
  {
    id: 'btnUpdate2',

    //icon: 'mdi-content-save',
    text: 'btn.Save',
    disable: false,
    visible: true,
  },

  //서브그리드 삭제
  {
    id: 'btnDelete2',

    //icon: 'mdi-delete',
    text: 'btn.Delete',
    disable: false,
    visible: true,
  },

  //검토요청
  {
    id: 'btnReqReview',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.ReqReview',
    disable: false,
    visible: true,
  },

  //검토요청취소
  {
    id: 'btnCancelReqReview',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CancelReqReview',
    disable: false,
    visible: true,
  },

  //재작성요청
  {
    id: 'btnReWrite',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.ReWrite',
    disable: false,
    visible: true,
  },

  //검토완료
  {
    id: 'btnFinishReview',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.FinishReview',
    disable: false,
    visible: true,
  },

  //수정요청
  {
    id: 'btnReqModify',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.ReqModify',
    disable: false,
    visible: true,
  },

  //수정승인
  {
    id: 'btnAcceptModify',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.AcceptModify',
    disable: false,
    visible: true,
  },

  //수정완료
  {
    id: 'btnFinishModify',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.FinishModify',
    disable: false,
    visible: true,
  },

  //첨부
  {
    id: 'btnAttach',

    //icon: 'mdi-upload',
    text: 'btn.Attach',
    disable: false,
    visible: true,
    permission: true,
  },

  //파일 업로드
  {
    id: 'btnFileUpload',

    //icon: 'mdi-upload',
    text: 'btn.Upload',
    disable: false,
    visible: true,
    permission: true,
  },

  // 복사
  {
    id: 'btnCopy',

    //icon: 'mdi-content-copy',
    text: 'btn.Copy',
    disable: false,
    visible: true,
  },

  // 방침/목표관리
  {
    id: 'btnPolicyGoalManagement',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.PolicyGoalManagement',
    disable: false,
    visible: true,
    permission: true,
  },

  // 목표/계획 작성(안전/보건/환경)
  {
    id: 'btnCreateGoalsPlans',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CreateGoalsPlans',
    disable: false,
    visible: true,
    permission: true,
  },

  // 송부
  {
    id: 'btnMail',

    //icon: 'mdi-email-fast-outline',
    text: 'btn.Mail',
    disable: false,
    visible: true,
  },

  // 시정조치서 송부
  {
    id: 'btnMailCAReport',

    //icon: 'mdi-email-fast-outline',
    text: 'btn.MailCAReport',
    disable: false,
    visible: true,
  },

  // 다운로드(안전지원 - 소방관리등록)
  {
    id: 'btnDownLoad',

    //icon: 'mdi-download',
    text: 'btn.DownLoad',
    disable: false,
    visible: true,
    permission: true,
  },

  // 조직도(안전지원 - 소방관리등록)
  {
    id: 'btnGroup',

    //icon: 'mdi-account-group',
    text: 'btn.Group',
    disable: false,
    visible: true,
    permission: true,
  },

  // 임무숙지훈련기록부(안전지원 - 소방관리등록)
  {
    id: 'btnMissionRecode',

    //icon: 'mdi-note-edit',
    text: 'btn.MissionRecode',
    disable: false,
    visible: true,
    permission: true,
  },

  // SMS발신
  {
    id: 'btnSendSms',

    //icon: 'mdi-send',
    text: 'btn.sendSms',
    disable: false,
    visible: true,
  },

  //세부사항 조회/입력(안전 - 안전사고 등록/현황)
  {
    id: 'btnDetailSearch',

    //icon: 'mdi-note-edit',
    text: 'btn.DetailSearch',
    disable: false,
    visible: true,
    permission: true,
  },

  //산업재해 조사표 파일 첨부(안전 - 안전사고 등록/현황)
  {
    id: 'btnSafetyUpload',

    //icon: 'mdi-upload',
    text: 'btn.SafetyUpload',
    disable: false,
    visible: true,
    permission: true,
  },

  //산업재해 조사표 조회/입력(안전 - 안전사고 등록/현황)
  {
    id: 'btnSafetySearch',

    //icon: 'mdi-note-edit',
    text: 'btn.SafetySearch',
    disable: false,
    visible: true,
    permission: true,
  },

  //내용확인(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnCheck',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.Check',
    disable: false,
    visible: true,
    permission: true,
  },

  //자율안전인증 취소(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnCancelAutoSafety',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CancelAutoSafety',
    disable: false,
    visible: true,
    permission: true,
  },

  //작성완료취소(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnCancelWrite',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CancelWrite',
    disable: false,
    visible: true,
  },

  //안전확인(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnSafetyCheck',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.SafetyCheck',
    disable: false,
    visible: true,
    permission: true,
  },

  //종결(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnComplete',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.Complete',
    disable: false,
    visible: true,
    permission: true,
  },

  //종결취소(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnCancelComplete',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CancelComplete',
    disable: false,
    visible: true,
    permission: true,
  },

  //사고 세부사항 조회(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnSafetyDetailSearch',

    //icon: 'mdi-magnify',
    text: 'btn.SafetyDetailSearch',
    disable: false,
    visible: true,
    permission: true,
  },

  //인적사항 조회/수정(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnPersonalSearch',

    //icon: 'mdi-magnify',
    text: 'btn.PersonalSearch',
    disable: false,
    visible: true,
    permission: true,
  },

  // 개정(위험성평가)
  {
    id: 'btnRevision',

    //icon: 'mdi-note-text',
    text: 'btn.Revision',
    disable: false,
    visible: true,
  },

  //안전사고 위험성평가
  {
    id: 'btnAssessment',
    text: 'btn.Assessment',
    disable: false,
    visible: true,
    permission: true,
  },

  // 새로고침(안전-호선별(POB) 현황)
  {
    id: 'btnReload',

    //icon: 'mdi-reload',
    text: 'btn.Reload',
    disable: false,
    visible: true,
    permission: true,
  },

  // 회수
  {
    id: 'btnRecall',

    //icon: 'mdi-refresh',
    text: 'btn.Recall',
    disable: false,
    visible: true,
    permission: true,
  },

  //일괄적용(안전- 위험작업 작업별 등급관리)
  {
    id: 'btnCollectiveApp',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.CollectiveApp',
    disable: false,
    visible: true,
    permission: true,
  },

  //조회(병행체크)
  {
    id: 'btnSearchParallelism',

    //icon: 'mdi-magnify',
    text: 'btn.SearchParallelism',
    disable: false,
    visible: true,
    permission: true,
  },

  //허가서작성(일반공사)
  {
    id: 'btnWritePermission',

    //icon: 'mdi-note-edit',
    text: 'btn.WritePermission',
    disable: false,
    visible: true,
    permission: true,
  },
  //허가서작성(단기공사)
  {
    id: 'btnWritePermissionS',

    //icon: 'mdi-note-edit',
    text: 'btn.WritePermissionS',
    disable: false,
    visible: true,
    permission: true,
  },

  //허가서삭제
  {
    id: 'btnDeletePermission',

    //icon: 'mdi-delete',
    text: 'btn.DeletePermission',
    disable: false,
    visible: true,
    permission: true,
  },

  //선택대상출력
  {
    id: 'btnPrintCheck',

    //icon: 'mdi-printer',
    text: 'btn.PrintCheck',
    disable: false,
    visible: true,
    permission: true,
  },

  //수기양식출력
  {
    id: 'btnPrintHandwriting',

    //icon: 'mdi-printer',
    text: 'btn.PrintHandwriting',
    disable: false,
    visible: true,
    permission: true,
  },

  //미병행작업 일괄승인
  {
    id: 'btnAllPermission',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.AllPermission',
    disable: false,
    visible: true,
    permission: true,
  },

  //개별허가
  {
    id: 'btnIndividualPermission',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.IndividualPermission',
    disable: false,
    visible: true,
    permission: true,
  },

  //허가취소
  {
    id: 'btnCancelPermission',

    //icon: 'mdi-alert-circle-check',
    text: 'btn.CancelPermission',
    disable: false,
    visible: true,
    permission: true,
  },

  //등록
  {
    id: 'btnRegist',

    //icon: 'mdi-plus-circle',
    text: 'btn.Regist',
    disable: false,
    visible: true,
  },

  //등록(산재)
  {
    id: 'btnRegist1',

    //icon: 'mdi-plus-circle',
    text: 'btn.Regist1',
    disable: false,
    visible: true,
  },

  //등록(재요양)
  {
    id: 'btnRegist2',

    //icon: 'mdi-plus-circle',
    text: 'btn.Regist2',
    disable: false,
    visible: true,
  },

  //등록(일반)
  {
    id: 'btnRegist3',

    //icon: 'mdi-plus-circle',
    text: 'btn.Regist3',
    disable: false,
    visible: true,
  },

  // 다운로드(안전지원 - 소방관리등록)
  {
    id: 'btnExcel',

    //icon: 'mdi-download',
    text: 'btn.excel',
    disable: false,
    visible: true,
    permission: true,
  },

  // 엑셀업로드
  {
    id: 'btnExcelUpload',

    //icon: 'mdi-download',
    text: 'btn.excelUpload',
    disable: false,
    visible: true,
  },

  // 엑셀다운로드
  {
    id: 'btnExcelDownload',

    //icon: 'mdi-download',
    text: 'btn.excelDownload',
    disable: false,
    visible: true,
    permission: true,
  },

  // 취업치료/종결신청
  {
    id: 'btnEmployCare',

    //icon: 'mdi-check-bold',
    text: 'btn.EmployCare',
    disable: false,
    visible: true,
  },

  // 특별감소대책
  {
    id: 'btnMeasures',

    //icon: 'mdi-file-excel',
    text: 'btn.Measures',
    disable: false,
    visible: true,
    permission: true,
  },

  // 작업표준리스트
  {
    id: 'btnWorkStandard',

    //icon: 'mdi-file-excel',
    text: 'btn.WorkStandard',
    disable: false,
    visible: true,
    permission: true,
  },

  //심사대장관리
  {
    id: 'btnReviewManagement',
    text: 'btn.ReviewManagement',
    disable: false,
    visible: true,
  },

  //확정
  {
    id: 'btnConfirm',
    text: 'btn.Confirm',
    disable: false,
    visible: true,
  },

  //확정취소
  {
    id: 'btnCancelConfirm',
    text: 'btn.CancelConfirm',
    disable: false,
    visible: true,
  },

  //확정취소요청
  {
    id: 'btnRequestCancelConfirm',
    text: 'btn.RequestCancelConfirm',
    disable: false,
    visible: true,
    permission: true,
  },

  //선택분등록부등재
  {
    id: 'btnChkRegisterSave',
    text: 'btn.ChkRegisterSave',
    disable: false,
    visible: true,
    permission: true,
  },

  //선택분등록부삭제
  {
    id: 'btnChkRegisterDelete',
    text: 'btn.ChkRegisterDelete',
    disable: false,
    visible: true,
    permission: true,
  },

  //요양관리
  {
    id: 'btnMedicalCareManagement',
    text: 'btn.MedicalCareManagement',
    disable: false,
    visible: true,
  },

  //요양신청서 출력
  {
    id: 'btnApplicationForMedicalCareOutput',
    text: 'btn.ApplicationForMedicalCareOutput',
    disable: false,
    visible: true,
  },

  //산재자 카드 출력
  {
    id: 'btnIndustrialAccidentCompensationCardOutput',
    text: 'btn.IndustrialAccidentCompensationCardOutput',
    disable: false,
    visible: true,
  },

  //보고서 출력
  {
    id: 'btnOfficialPaperOutput',
    text: 'btn.OfficialPaperOutput',
    disable: false,
    visible: true,
  },

  //조치결과등록
  {
    id: 'btnActionResultRegistraion',
    text: 'btn.ActionResultRegistraion',
    disable: false,
    visible: true,
  },

  //결과등록
  {
    id: 'btnResultRegistraion',
    text: 'btn.ResultRegistraion',
    disable: false,
    visible: true,
  },

  // 번역
  {
    id: 'btnTrans',
    text: 'btn.Trans',
    disable: false,
    visible: true,
    permission: true,
  },

  //파일추가
  {
    id: 'btnFileAdd',
    text: 'btn.FileAdd',
    disable: false,
    visible: true,
    permission: true,
  },

  //신규
  {
    id: 'btnNew',
    text: 'btn.New',
    disable: false,
    visible: true,
  },

  //공지사항 등록
  {
    id: 'btnNoticeAdd',
    text: 'btn.NoticeAdd',
    disable: false,
    visible: true,
  },
  {
    id: 'btnFaqAdd',
    text: 'btn.FAQAdd',
    disable: false,
    visible: true,
  },
  // 폐지
  {
    id: 'btnRskDel',
    text: 'btn.RSKDel',
    disable: false,
    visible: true,
  },
  // 폐지 취소
  {
    id: 'btnCancelRSKDel',
    text: 'btn.CancelRSKDel',
    disable: false,
    visible: true,
  },

  //그룹 추가, 저장, 삭제
  {
    id: 'btnGroupCreate',
    text: 'btn.GroupCreate',
    disable: false,
    visible: true,
    permission: true,
  },
  {
    id: 'btnGroupUpdate',
    text: 'btn.GroupUpdate',
    disable: false,
    visible: true,
    permission: true,
  },
  {
    id: 'btnGroupDelete',
    text: 'btn.GroupDelete',
    disable: false,
    visible: true,
    permission: true,
  },
  //인원조회
  {
    id: 'btnPersonSearch',
    text: 'btn.PersonSearch',
    disable: false,
    visible: true,
    permission: true,
  },
  //인원추가
  {
    id: 'btnPersonCreate',
    text: 'btn.PersonCreate',
    disable: false,
    visible: true,
  },

  //인원저장
  {
    id: 'btnPersonUpdate',
    text: 'btn.PersonUpdate',
    disable: false,
    visible: true,
    permission: true,
  },

  //인원삭제
  {
    id: 'btnPersonDelete',
    text: 'btn.PersonDelete',
    disable: false,
    visible: true,
    permission: true,
  },

  //랜덤 차수
  {
    id: 'btnRandomNum',
    text: 'btn.RandomNum',
    disable: false,
    visible: true,
    permission: true,
  },

  //메일발송
  {
    id: 'btnSendMail',
    text: 'btn.SendMail',
    disable: false,
    visible: true,
  },
  //메일발송
  {
    id: 'btnAddressMail',
    text: 'btn.AddressMail',
    disable: false,
    visible: true,
  },

  //엑셀 샘플 다운로드
  {
    id: 'btnSampleDown',
    text: 'btn.SampleDown',
    disable: false,
    visible: true,
    permission: true,
  },

  //html 복사
  {
    id: 'btnHtmlCopy',
    text: 'btn.HtmlCopy',
    disable: false,
    visible: true,
    permission: true,
  },

  //일괄 제외 처리
  {
    id: 'btnBatchExcept',
    text: 'btn.BatchExcept',
    disable: false,
    visible: true,
    permission: true,
  },

  //호선/프로젝트명 일괄입력
  {
    id: 'btnBatchInput',
    text: 'btn.BatchInput',
    disable: false,
    visible: true,
    permission: true,
  },

  //순차입력
  {
    id: 'btnSeqInput',
    text: 'btn.SeqInput',
    disable: false,
    visible: true,
    permission: true,
  },

  //발행
  {
    id: 'btnPublish',
    text: 'btn.Publish',
    disable: false,
    visible: true,
  },

  //최종결재
  {
    id: 'btnPartnerApply',
    text: 'btn.PartnerApply',
    disable: false,
    visible: true,
  },
  //반려(협력사)
  {
    id: 'btnPartnerReject',
    text: 'btn.PartnerReject',
    disable: false,
    visible: true,
  },

  //전체조회
  {
    id: 'btnSearchAll',
    text: 'btn.SearchAll',
    disable: false,
    visible: true,
    permission: true,
  },

  //부서변경
  {
    id: 'btnAsgnChange',
    text: 'btn.AsgnChange',
    disable: false,
    visible: true,
    permission: true,
  },

  //마감
  {
    id: 'btnSaveClose',
    text: 'btn.SaveClose',
    disable: false,
    visible: true,
  },

  //마감취소
  {
    id: 'btnCancelClose',
    text: 'btn.CancelClose',
    disable: false,
    visible: true,
  },

  //마감이력
  {
    id: 'btnCloseHistory',
    text: 'btn.CloseHistory',
    disable: false,
    visible: true,
  },

  //재발급 신청
  {
    id: 'btnReissueReq',
    text: 'btn.ReissueReq',
    disable: false,
    visible: true,
  },

  //신청 취소
  {
    id: 'btnReqCancel',
    text: 'btn.ReqCancel',
    disable: false,
    visible: true,
    permission: true,
  },

  //자격증 출력
  {
    id: 'btnLicePrint',
    text: 'btn.LicePrint',
    disable: false,
    visible: true,
  },

  //자격증 출력(폼지사용)
  {
    id: 'btnLicePrintForm',
    text: 'btn.LicePrintForm',
    disable: false,
    visible: true,
  },

  //분실 사유서 양식
  {
    id: 'btnLossFileForm',
    text: 'btn.LossFileForm',
    disable: false,
    visible: true,
    permission: true,
  },

  //확장
  {
    id: 'btnExpand',
    text: 'btn.Expand',
    disable: false,
    visible: true,
    permission: true,
  },

  //축소
  {
    id: 'btnCollapse',
    text: 'btn.Collapse',
    disable: false,
    visible: true,
    permission: true,
  },

  //하위추가
  {
    id: 'btnAddChild',
    text: 'btn.AddChild',
    disable: false,
    visible: true,
  },

  //평가대상측면목록 자동생성
  {
    id: 'btnTargetAutoCreate',
    text: 'btn.TargetAutoCreate',
    disable: false,
    visible: true,
  },

  //적용
  {
    id: 'btnRskCopyApp',
    text: 'btn.RskCopyApp',
    disable: false,
    visible: true,
    permission: true,
  },

  //부서별 부적합 현황(건수)
  {
    id: 'btnIncongruitySearch',
    text: 'btn.IncongruitySearch',
    disable: false,
    visible: true,
    permission: true,
  },

  //작성완료/발송
  {
    id: 'btnCompleteSAF',
    text: 'btn.CompleteSAF',
    disable: false,
    visible: true,
  },

  //작성완료/발송
  {
    id: 'btnCompleteSend',
    text: 'btn.CompleteSend',
    disable: false,
    visible: true,
  },

  //수정
  {
    id: 'btnModify',
    text: 'btn.Modify',
    disable: false,
    visible: true,
  },

  //일괄승인
  {
    id: 'btnAllApprove',
    text: 'btn.AllApprove',
    disable: false,
    visible: true,
    // permission: true,
  },
  //일괄승인취소
  {
    id: 'btnAllApproveCancel',
    text: 'btn.AllApproveCancel',
    disable: false,
    visible: true,
    //permission: true,
  },

  //SLI 감점대상자 조회
  {
    id: 'btnPointDeduction',
    text: 'btn.PointDeduction',
    disable: false,
    visible: true,
    //permission: true,
  },

  //합의서출력
  {
    id: 'btnPrintAgreement',
    text: 'btn.PrintAgreement',
    disable: false,
    visible: true,
  },

  //품의서출력
  {
    id: 'btnPrintApproval',
    text: 'btn.PrintApproval',
    disable: false,
    visible: true,
  },

  //반려
  {
    id: 'btnTurnBack',
    text: 'btn.TurnBack',
    disable: false,
    visible: true,
  },

  //표준복사
  {
    id: 'btnStandardCopy',
    text: 'btn.StandardCopy',
    disable: false,
    visible: true,
  },

  //작업표준복사
  {
    id: 'btnWorkStandardCopy',
    text: 'btn.WorkStandardCopy',
    disable: false,
    visible: true,
    permission: true,
  },

  //승인
  {
    id: 'btnApprove',
    text: 'btn.Approve',
    disable: false,
    visible: true,
  },

  //승인취소
  {
    id: 'btnApproveCancel',
    text: 'btn.ApproveCancel',
    disable: false,
    visible: true,
  },
  //반려
  {
    id: 'btnReject',
    text: 'btn.Reject',
    disable: false,
    visible: true,
  },
  //반려취소
  {
    id: 'btnRejectCancel',
    text: 'btn.RejectCancel',
    disable: false,
    visible: true,
  },
  //실적수정
  {
    id: 'btnPerfModify',
    text: 'btn.PerfModify',
    disable: false,
    visible: true,
  },

  //경감확정
  {
    id: 'btnReduConfirme',
    text: 'btn.ReduConfirme',
    disable: false,
    visible: true,
  },

  //일반수칙위반으로전환
  {
    id: 'btnGeneralRules',
    text: 'btn.GeneralRules',
    disable: false,
    visible: true,
  },
  //수정후 재상신
  {
    id: 'btnUploadedAfterRevision',
    text: 'btn.UploadedAfterRevision',
    disable: false,
    visible: true,
  },
  //상신 취소
  {
    id: 'btnCancellationOfApplication',
    text: 'btn.CancellationOfApplication',
    disable: false,
    visible: true,
  },
  //전송문구저장
  {
    id: 'btnSaveSMSContents',
    text: 'btn.SaveSMSContents',
    disable: false,
    visible: true,
    permission: true,
  },
  //전송
  {
    id: 'btnSend',
    text: 'btn.Send',
    disable: false,
    visible: true,
  },
  //제보등록
  {
    id: 'btnAddJebo',
    text: 'btn.AddJebo',
    disable: false,
    visible: true,
    permission: true,
  },
  //조치등록
  {
    id: 'btnAddJochi',
    text: 'btn.AddJochi',
    disable: false,
    visible: true,
  },

  //제보등록
  {
    id: 'btnAddJebo',
    text: 'btn.AddJebo',
    disable: false,
    visible: true,
  },
  //조치등록
  {
    id: 'btnAddJochi',
    text: 'btn.AddJochi',
    disable: false,
    visible: true,
  },

  //이수확정
  {
    id: 'btnCompleteConfirm',
    text: 'btn.CompleteConfirm',
    disable: false,
    visible: true,
  },
  //참고 (장비자격 운영기준)
  {
    id: 'btnEquipmentManual',
    text: 'btn.EquipmentManual',
    disable: false,
    visible: true,
    permission: true,
  },
  //변경
  {
    id: 'btnChange',
    text: 'btn.Change',
    disable: false,
    visible: true,
  },

  //제외
  {
    id: 'btnExcept',
    text: 'btn.Except',
    disable: false,
    visible: true,
  },
  //이수증 출력
  {
    id: 'btnCertPrint',
    text: 'btn.CertPrint',
    disable: false,
    visible: true,
  },
  //추출
  {
    id: 'btnExtraction',
    text: 'btn.Extraction',
    disable: false,
    visible: true,
  },
  //임시저장
  {
    id: 'btnTemporaryStorage',
    text: 'btn.TemporaryStorage',
    disable: false,
    visible: true,
  },
  //조치완료
  {
    id: 'btnActionComplete',
    text: 'btn.ActionComplete',
    disable: false,
    visible: true,
  },
  //인원등록
  {
    id: 'btnAddPerson',
    text: 'btn.AddPerson',
    disable: false,
    visible: true,
    permission: true,
  },
  //수강신청
  {
    id: 'btnCourseReq',
    text: 'btn.CourseReq',
    disable: false,
    visible: true,
    permission: true,
  },
  //신청취소
  {
    id: 'btnReqCancel',
    text: 'btn.ReqCancel',
    disable: false,
    visible: true,
  },
  //추가개설요청
  {
    id: 'btnAddOpenReq',
    text: 'btn.AddOpenReq',
    disable: false,
    visible: true,
    permission: true,
  },
  //확인
  {
    id: 'btnChk',
    text: 'btn.Chk',
    disable: false,
    visible: true,
    permission: true,
  },
  //설문지 추가
  {
    id: 'btnAddSurvey',
    text: 'btn.AddSurvey',
    disable: false,
    visible: true,
    permission: true,
  },
  //선택 설문지 복사
  {
    id: 'btnCopySurvey',
    text: 'btn.CopySurvey',
    disable: false,
    visible: true,
    permission: true,
  },
  //설문지 선택
  {
    id: 'btnSelectSurvey',
    text: 'btn.SelectSurvey',
    disable: false,
    visible: true,
    permission: true,
  },
  //미리보기
  {
    id: 'btnPreview',
    text: 'btn.Preview',
    disable: false,
    visible: true,
    permission: true,
  },
  //문항추가
  {
    id: 'btnAddQu',
    text: 'btn.AddQu',
    disable: false,
    visible: true,
  },
  //선택된 문항 사용
  {
    id: 'btnUseQu',
    text: 'btn.UseQu',
    disable: false,
    visible: true,
    permission: true,
  },
  //선택된 문항 제외
  {
    id: 'btnExclusionQu',
    text: 'btn.ExclusionQu',
    disable: false,
    visible: true,
    permission: true,
  },
  //수강인원 추가
  {
    id: 'btnCrsPersAdd',
    text: 'btn.CrsPersAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //수강인원 삭제
  {
    id: 'btnCrsPersDelete',
    text: 'btn.CrsPersDelete',
    disable: false,
    visible: true,
    permission: true,
  },
  //일괄 중단
  {
    id: 'btnBatchStop',
    text: 'btn.BatchStop',
    disable: false,
    visible: true,
  },
  //지급 확정
  {
    id: 'btnPaymentConfirm',
    text: 'btn.PaymentConfirm',
    disable: false,
    visible: true,
  },
  //회수 확정
  {
    id: 'btnRecoveryConfirm',
    text: 'btn.RecoveryConfirm',
    disable: false,
    visible: true,
  },

  //선택 제거
  {
    id: 'btnSelectRemove',
    text: 'btn.SelectRemove',
    disable: false,
    visible: true,
    permission: true,
  },
  //모두 제거
  {
    id: 'btnAllRemove',
    text: 'btn.AllRemove',
    disable: false,
    visible: true,
    permission: true,
  },
  //모두 적용
  {
    id: 'btnAllApply',
    text: 'btn.AllApply',
    disable: false,
    visible: true,
    permission: true,
  },

  //위
  {
    id: 'btnMoveUp',
    text: 'btn.MoveUp',
    disable: false,
    visible: true,
    permission: true,
  },

  //아래로
  {
    id: 'btnMoveDown',
    text: 'btn.MoveDown',
    disable: false,
    visible: true,
    permission: true,
  },

  //위(서브)
  {
    id: 'btnMoveUp2',
    text: 'btn.MoveUp',
    disable: false,
    visible: true,
    permission: true,
  },

  //아래로(서브)
  {
    id: 'btnMoveDown2',
    text: 'btn.MoveDown',
    disable: false,
    visible: true,
    permission: true,
  },

  //재해율목표관리
  {
    id: 'btnDisasterRateTargetMnt',
    text: 'btn.DisasterRateTargetMnt',
    disable: false,
    visible: true,
  },
  //주/월간 현황
  {
    id: 'btnWeeklyMonthlyStatus',
    text: 'btn.WeeklyMonthlyStatus',
    disable: false,
    visible: true,
    permission: true,
  },
  // 주제등록
  {
    id: 'btnRegisterTask',
    text: 'btn.RegisterTask',
    disable: false,
    visible: true,
  },
  //설문지 현황 관리
  {
    id: 'btnQuestionnaireStatus',
    text: 'btn.QuestionnaireStatus',
    disable: false,
    visible: true,
    permission: true,
  },
  //설문지 등록
  {
    id: 'btnRegisterQuestion',
    text: 'btn.RegisterQuestion',
    disable: false,
    visible: true,
    permission: true,
  },
  //RISK통합관리 보내기
  {
    id: 'btnSendIntegratedManagement',
    text: 'btn.SendIntegratedManagement',
    disable: false,
    visible: true,
  },
  //리스트 출력
  {
    id: 'btnPrintList',
    text: 'btn.PrintList',
    disable: false,
    visible: true,
  },
  //설문지 등록
  {
    id: 'btnRegisterSurvey',
    text: 'btn.RegisterSurvey',
    disable: false,
    visible: true,
  },
  //Mapping 정보 등록
  {
    id: 'btnRegisterMappingInfo',
    text: 'btn.RegisterMappingInfo',
    disable: false,
    visible: true,
  },
  //포인트 전환POINT_CHANGE
  {
    id: 'btnPointChange',
    text: 'btn.PointChange',
    disable: false,
    visible: true,
    permission: true,
  },
  //교육등록
  {
    id: 'btnEduAdd',
    text: 'btn.EduAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //교육복사
  {
    id: 'btnEduCopy',
    text: 'btn.EduCopy',
    disable: false,
    visible: true,
    permission: true,
  },
  //QR코드 출력
  {
    id: 'btnQrCodePrint',
    text: 'btn.QrCodePrint',
    disable: false,
    visible: true,
    permission: true,
  },
  //통보
  {
    id: 'btnNotice',
    text: 'btn.Notice',
    disable: false,
    visible: true,
  },
  //차수 자동추가
  {
    id: 'btnAutoAddNum',
    text: 'btn.AutoAddNum',
    disable: false,
    visible: true,
    permission: true,
  },
  //대상자 목록 출력
  {
    id: 'btnPointListPrint',
    text: 'btn.PointListPrint',
    disable: false,
    visible: true,
    permission: true,
  },
  //설정clearable
  {
    id: 'btnSetting',
    text: 'btn.Setting',
    disable: false,
    visible: true,
    permission: true,
  },
  //설정 완료
  {
    id: 'btnSettingF',
    text: 'btn.SettingF',
    disable: false,
    visible: true,
    permission: true,
  },
  // 병행작업 조회
  {
    id: 'btnShowCross',
    text: 'btn.ShowCross',
    disable: false,
    visible: true,
    permission: true,
  },

  //전체 차수 조회
  {
    id: 'btnAllTimeSearch',
    text: 'btn.AllTimeSearch',
    disable: false,
    visible: true,
    permission: true,
  },
  //모든 차수 적용
  {
    id: 'btnAllNumApply',
    text: 'btn.AllNumApply',
    disable: false,
    visible: true,
    permission: true,
  },
  // 시력검사일정 설정
  {
    id: 'btnEyesightScheduleSetting',
    text: 'btn.EyesightScheduleSetting',
    disable: false,
    visible: true,
  },
  // 시력검사일정 추가
  {
    id: 'btnEyesightScheduleAdd',
    text: 'btn.EyesightScheduleAdd',
    disable: false,
    visible: true,
  },
  //선택항목 일괄적용
  {
    id: 'btnSelectListCollApply',
    text: 'btn.SelectListCollApply',
    disable: false,
    visible: true,
  },
  //교육대상자 인원추가
  {
    id: 'btnEduTargetAdd',
    text: 'btn.EduTargetAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //공사 접수 반려
  {
    id: 'btnReqReturn',

    //icon: 'mdi-check-circle-outline',
    text: 'btn.btnReqReturn',
    disable: false,
    visible: true,
  },
  //단기공사 인원추가
  {
    id: 'btnShrtConstPersAdd',
    text: 'btn.ShrtConstPersAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //작업중지해제 인원조회
  {
    id: 'btnSOSRelPersSearch',
    text: 'btn.SOSRelPersSearch',
    disable: false,
    visible: true,
  },
  //컷오프 대상자 추가
  {
    id: 'btnCutOffTargetAdd',
    text: 'btn.CutOffTargetAdd',
    disable: false,
    visible: true,
  },
  //불참인원추가
  {
    id: 'btnAbsPersonAdd',
    text: 'btn.AbsPersonAdd',
    disable: false,
    visible: true,
  },
  //대상자 차수 자동 분배
  {
    id: 'btnTargetAutoAddNum',
    text: 'btn.TargetAutoAddNum',
    disable: false,
    visible: true,
    permission: true,
  },
  //직무별 대상자 추가
  {
    id: 'btnByDutyTargetAdd',
    text: 'btn.ByDutyTargetAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //대상자 추가
  {
    id: 'btnTargetAdd',
    text: 'btn.TargetAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  //대상자 삭제
  {
    id: 'btnTargetDelete',
    text: 'btn.TargetDelete',
    disable: false,
    visible: true,
    permission: true,
  },

  //위험성 평가 요약출력
  {
    id: 'btnSimplePrint',
    text: 'btn.SimplePrint',
    disable: false,
    visible: true,
    permission: true,
  },

  //위험성 평가 상세출력
  {
    id: 'btnDetailPrint',
    text: 'btn.DetailPrint',
    disable: false,
    visible: true,
    permission: true,
  },

  //위험성 평가 워드출력
  {
    id: 'btnWordPrint',
    text: 'btn.WordPrint',
    disable: false,
    visible: true,
    permission: true,
  },

  //위험성 평가 워드출력
  {
    id: 'btnWordPrintAdmin',
    text: 'btn.WordPrintAdmin',
    disable: false,
    visible: true,
    permission: true,
  },

  //위험성 평가 최종평가
  {
    id: 'btnStandardEval',
    text: 'btn.StandardEval',
    disable: false,
    visible: true,
    permission: true,
  },

  //목록
  {
    id: 'btnList',
    text: 'btn.List',
    disable: false,
    visible: true,
    permission: true,
  },

  //중복제안검색
  {
    id: 'btnDupSearch',
    text: 'btn.DupSearch',
    disable: false,
    visible: true,
    permission: true,
  },

  //완료
  {
    id: 'btnFinish',
    text: 'btn.Finish',
    disable: false,
    visible: true,
  },
  //말소(퇴사)
  {
    id: 'btnCancelLeave',
    text: 'btn.CancelLeave',
    disable: false,
    visible: true,
  },
  //말소(삭제)
  {
    id: 'btnCancelDelete',
    text: 'btn.CancelDelete',
    disable: false,
    visible: true,
  },
  //말소취소
  {
    id: 'btnCancelCancel',
    text: 'btn.CancelCancel',
    disable: false,
    visible: true,
  },
  //부서장확인
  {
    id: 'btnBsmgrConfirm',
    text: 'btn.BsmgrConfirm',
    disable: false,
    visible: true,
  },
  //부서장확인 취소
  {
    id: 'btnBsmgrConfirmCancel',
    text: 'btn.BsmgrConfirmCancel',
    disable: false,
    visible: true,
  },
  //RISK등록
  {
    id: 'btnRiskRegister',
    text: 'btn.RiskRegister',
    disable: false,
    visible: true,
    permission: true,
  },

  //제정요청
  {
    id: 'btnRequest',
    text: 'btn.Request',
    disable: false,
    visible: true,
    permission: true,
  },
  //오토바이등록 FAQ
  {
    id: 'btnMotorcycleRegFAQ',
    text: 'btn.MotorcycleRegFAQ',
    disable: false,
    visible: true,
    permission: true,
  },

  //신청
  {
    id: 'btnApplication',
    text: 'btn.Application',
    disable: false,
    visible: true,
    permission: true,
  },

  // 환경 데이터 추가
  {
    id: 'btnGetEnvData',
    text: 'btn.GetEnvData',
    disable: false,
    visible: true,
  },
  //알림발송
  {
    id: 'btnSendAlert',
    text: 'btn.SendAlert',
    disable: false,
    visible: true,
  },
  //회의록 작성
  {
    id: 'btnCreateMeetingPaper',
    text: 'btn.CreateMeetingPaper',
    disable: false,
    visible: true,
  },
  // 대상자 검색
  {
    id: 'btnTargetSearch',
    text: 'btn.TargetSearch',
    disable: false,
    visible: true,
    permission: true,
  },

  // 개정등록
  {
    id: 'btnReviseRegist',
    text: 'btn.ReviseRegist',
    disable: false,
    visible: true,
  },
  //불러오기
  {
    id: 'btnImport',
    text: 'btn.Import',
    disable: false,
    visible: true,
  },

  // 상세
  {
    id: 'btnDetail',
    text: 'btn.Detail',
    disable: false,
    visible: true,
    permission: true,
  },
  // 위험 작업 허가서
  // 이전PTW
  {
    id: 'btnPreviousPTW',
    text: 'btn.PreviousPTW',
    disable: false,
    visible: true,
    permission: true,
  },
  // 안전허가
  {
    id: 'btnSafetyClearance',
    text: 'btn.SafetyClearance',
    disable: false,
    visible: true,
    permission: true,
  },
  // 안전취소
  {
    id: 'btnSafeCancellation',
    text: 'btn.SafeCancellation',
    disable: false,
    visible: true,
    permission: true,
  },
  // 안전허가반려
  {
    id: 'btnSafetyPermitRefusal',
    text: 'btn.SafetyPermitRefusal',
    disable: false,
    visible: true,
    permission: true,
  },
  // 승인/안전제출
  {
    id: 'btnApproval/SafetySubmission',
    text: 'btn.Approval/SafetySubmission',
    disable: false,
    visible: true,
    permission: true,
  },
  // 제출취소
  {
    id: 'btnCancelSubmission',
    text: 'btn.CancelSubmission',
    disable: false,
    visible: true,
    permission: true,
  },
  // 허가서출력
  {
    id: 'btnPrintOutPermit',
    text: 'btn.PrintOutPermit',
    disable: false,
    visible: true,
    permission: true,
  },

  // 행복사
  {
    id: 'btnRowCopy',
    text: 'btn.RowCopy',
    disable: false,
    visible: true,
    permission: true,
  },
  //전송
  {
    id: 'btnSendNormal',
    text: 'btn.SendNormal',
    disable: false,
    visible: true,
  },
  //초기화
  {
    id: 'btnReset',
    text: 'btn.Reset',
    disable: false,
    visible: true,
    permission: true,
  },
  //신규 저장
  {
    id: 'btnNewSave',
    text: 'btn.NewSave',
    disable: false,
    visible: true,
  },
  //계획수정
  {
    id: 'btnModPlan',
    text: 'btn.ModPlan',
    disable: false,
    visible: true,
    permission: true,
  },
  //실적등록
  {
    id: 'btnPerfReg',
    text: 'btn.PerfReg',
    disable: false,
    visible: true,
    permission: true,
  },
  //실적등록
  {
    id: 'btnApplyLiceStatus',
    text: 'btn.ApplyLiceStatus',
    disable: false,
    visible: true,
    permission: true,
  },
  //개설
  {
    id: 'btnOpen',
    text: 'btn.Open',
    disable: false,
    visible: true,
  },
  //초기화(신규)
  {
    id: 'btnInitNew',
    text: 'btn.InitNew',
    disable: false,
    visible: true,
  },

  //평가협력사 선정
  {
    id: 'btnSelectPartner',
    text: 'btn.SelectPartner',
    disable: false,
    visible: true,
  },
  //수칙위반등록
  {
    id: 'btnRegistViolation',
    text: 'btn.RegistViolation',
    disable: false,
    visible: true,
  },
  //승인/발송
  {
    id: 'btnApproveAndSend',
    text: 'btn.ApproveAndSend',
    disable: false,
    visible: true,
  },
  //설문지 전송
  {
    id: 'btnSendSurvey',
    text: 'btn.SendSurvey',
    disable: false,
    visible: true,
    permission: true,
  },
  //새 버전 만들기
  {
    id: 'btnNewVersion',
    text: 'btn.NewVersion',
    disable: false,
    visible: true,
  },

  //미흡 안내메일
  {
    id: 'btnInsfNotiMail',
    text: 'btn.InsfNotiMail',
    disable: false,
    visible: true,
  },

  //매뉴얼
  {
    id: 'btnManual',
    text: 'btn.Manual',
    disable: false,
    visible: true,
    permission: true,
  },

  //평가 대상 선정
  {
    id: 'btnSelectEvalTarget',
    text: 'btn.SelectEvalTarget',
    disable: false,
    visible: true,
  },
  //작업중지조치등록
  {
    id: 'btnWorkStopResist',
    text: 'btn.WorkStopResist',
    disable: false,
    visible: true,
  },
  //시정통보
  {
    id: 'btnMuniNotice',
    text: 'btn.MuniNotice',
    disable: false,
    visible: true,
    permission: true,
  },
  // 위험기계 정보 일괄변경
  {
    id: 'btnBATCH_CHANGE_HAZARDOUS_MACHINE_INFORMATION',
    text: 'btn.BATCH_CHANGE_HAZARDOUS_MACHINE_INFORMATION',
    disable: false,
    visible: true,
  },
  // 배너등록
  {
    id: 'btnRegistBanner',
    text: 'btn.RegistBanner',
    disable: false,
    visible: true,
    permission: true,
  },

  // 재해지표
  {
    id: 'btnDisasterIndicator',
    text: 'btn.DisasterIndicators',
    disable: false,
    visible: true,
    permission: true,
  },

  // 안전관리자 역량평가
  {
    id: 'btnSafetyManagerCompetency',
    text: 'btn.SafetyManagerCompetency',
    disable: false,
    visible: true,
    permission: true,
  },

  // 안전활동
  {
    id: 'btnSafetyActivities',
    text: 'btn.SafetyActivities',
    disable: false,
    visible: true,
    permission: true,
  },

  // 위험성평가
  {
    id: 'btnRiskAssessment',
    text: 'btn.RiskAssessment',
    disable: false,
    visible: true,
    permission: true,
  },

  // 모바일 작업지시
  {
    id: 'btnMobileInstruct',
    text: 'btn.MobileInstruct',
    disable: false,
    visible: true,
    permission: true,
  },

  // 법적서류 및 인증
  {
    id: 'btnLegalDocuments',
    text: 'btn.LegalDocuments',
    disable: false,
    visible: true,
    permission: true,
  },

  // 제도준수
  {
    id: 'btnSystemCompliance',
    text: 'btn.SystemCompliance',
    disable: false,
    visible: true,
    permission: true,
  },

  // 안전교육
  {
    id: 'btnSafetyEdu',
    text: 'btn.SafetyEdu',
    disable: false,
    visible: true,
    permission: true,
  },

  // 안전개입/안전작업 요구권
  {
    id: 'btnSafetyIntervention',
    text: 'btn.SafetyIntervention',
    disable: false,
    visible: true,
    permission: true,
  },

  // 현장 개선활동
  {
    id: 'btnImprovementActivities',
    text: 'btn.ImprovementActivities',
    disable: false,
    visible: true,
    permission: true,
  },

  // 신규검사
  {
    id: 'btnNewTest',
    text: 'btn.NewTest',
    disable: false,
    visible: true,
  },

  //단기공사 상세정보
  //결재이력
  {
    id: 'btnShortApply',
    text: 'btn.btnShortApply',
    disable: false,
    visible: true,
    permission: true,
  },
  //전달
  {
    id: 'btnShortEmail',
    text: 'btn.btnShortEmail',
    disable: false,
    visible: true,
    permission: true,
  },
  //안전팀확인
  {
    id: 'btnShortSafety',
    text: 'btn.btnShortSafety',
    disable: false,
    visible: true,
    permission: true,
  },
  //출입인원상세
  {
    id: 'btnShortDetail',
    text: 'btn.btnShortDetail',
    disable: false,
    visible: true,
    permission: true,
  },
  //썸네일등록
  {
    id: 'btnThumbnail',
    text: 'btn.btnThumbnail',
    disable: false,
    visible: true,
  },
  // 가져오기
  {
    id: 'btnIMPR',
    text: 'btn.btnIMPR',
    disable: false,
    visible: true,
    permission: true,
  },
  // 재조치요청
  {
    id: 'btnReAction',
    text: 'btn.ReAction',
    disable: false,
    visible: true,
  },

  // 순서저장
  {
    id: 'btnSaveSeq',
    text: 'btn.SaveSeq',
    disable: false,
    visible: true,
    permission: true,
  },
  // PTW화 반려
  {
    id: 'btnPTWCMPNN',
    text: 'btn.PTWCMPNN',
    disable: false,
    visible: true,
  },
  // PTW화 승인
  {
    id: 'btnPTWAPRVL',
    text: 'btn.PTWAPRVL',
    disable: false,
    visible: true,
  },
  // PTW화 승인
  {
    id: 'btnPTWRequest',
    text: 'btn.PTWRequest',
    disable: false,
    visible: true,
  },
  // 검사대상추가
  {
    id: 'btnAddInspTarget',
    text: 'btn.AddInspTarget',
    disable: false,
    visible: true,
  },
  // 검사대상삭제
  {
    id: 'btnRmvInspTarget',
    text: 'btn.RmvInspTarget',
    disable: false,
    visible: true,
  },
  // 위치추가
  {
    id: 'btnADD_LOCATION',
    text: 'btn.ADD_LOCATION',
    disable: false,
    visible: true,
    permission: true,
  },
  // 위치 삭제
  {
    id: 'btnDELETE_LOCATION',
    text: 'btn.DELETE_LOCATION',
    disable: false,
    visible: true,
    permission: true,
  },

  // 표준서현황
  {
    id: 'btnStdDocStatus',
    text: 'btn.STD_DOC_STUS',
    disable: false,
    visible: true,
    permission: true,
  },
  // 강사 추가
  {
    id: 'btnLectAdd',
    text: 'btn.LectAdd',
    disable: false,
    visible: true,
    permission: true,
  },
  // 일괄양식다운로드
  {
    id: 'btnFormDown',
    text: 'btn.FormDown',
    disable: false,
    visible: true,
    permission: true,
  },
  // 양식다운로드
  {
    id: 'btnFormDownload',
    text: 'btn.FormDownload',
    disable: false,
    visible: true,
    permission: true,
  },
  // 일괄양식올리기
  {
    id: 'btnFromUpload',
    text: 'btn.FromUpload',
    disable: false,
    visible: true,
    permission: true,
  },
  // 강재승인
  {
    id: 'btnSteelApproved',
    text: 'btn.SteelApproved',
    disable: false,
    visible: true,
  },

  //단기공사 적격성평가 첨부파일 뷰어
  {
    id: 'btnShortFileViewer',
    text: 'btn.ShortFileViewer',
    disable: false,
    visible: true,
    permission: true,
  },
  {
    id: 'btnShortFileDownload',
    text: 'btn.ShortFileDownload',
    disable: false,
    visible: true,
    permission: true,
  },

  //담당자확정
  {
    id: 'btnConfirmChargePerson',
    text: 'btn.ConfirmChargePerson',
    disable: false,
    visible: true,
    permission: true,
  },

  //다른날짜로 복사
  {
    id: 'btnToDateCopy',
    text: 'btn.ToDateCopy',
    disable: false,
    visible: true,
    permission: true,
  },

  //접수
  {
    id: 'btnReceipt',
    text: 'btn.Receipt',
    disable: false,
    visible: true,
  },

  //다음
  {
    id: 'btnNext',
    text: 'btn.Next',
    disable: false,
    visible: true,
    permission: true,
  },

  //이전
  {
    id: 'btnPrev',
    text: 'btn.Prev',
    disable: false,
    visible: true,
    permission: true,
  },

  //일괄추가
  {
    id: 'btnBulkCreate',
    text: 'btn.BulkCreate',
    disable: false,
    visible: true,
    permission: true,
  },

  //안전요원 추가
  {
    id: 'btnAddEmp',
    text: 'btn.AddEmp',
    disable: false,
    visible: true,
  },

  //안전요원 추가
  {
    id: 'btnSetTeam',
    text: 'btn.SetTeam',
    disable: false,
    visible: true,
    permission: true,
  },

  //안전요원 추가 - 호선
  {
    id: 'btnSetTeamShip',
    text: 'btn.SetTeamShip',
    disable: false,
    visible: true,
    permission: true,
  },

  //회사 공지
  {
    id: 'btnAnnounceMail',
    text: 'btn.AnnounceMail',
    disable: false,
    visible: true,
  },
  //Firebase 테스트 (알람)
  {
    id: 'btnSendFirebase',
    text: 'btn.SendFirebase',
    disable: false,
    visible: true,
    permission: true,
  },
  //FRCA등럭
  {
    id: 'btnSetRCA',
    text: 'btn.SetRCA',
    disable: false,
    visible: true,
    permission: true,
  },
  //법제처 사이트로 이동
  {
    id: 'btnLaw',
    text: 'btn.Law',
    disable: false,
    visible: true,
    permission: true,
  },
  //부서 데이터 선택
  {
    id: 'btnInsa',
    text: 'btn.Insa',
    disable: false,
    visible: true,
    permission: true,
  },
  //조직도 확인하기
  {
    id: 'btnOrgPrint',
    text: 'btn.OrgPrint',
    disable: false,
    visible: true,
    permission: true,
  },
  //법제처 사이트로 이동
  {
    id: 'btnThisDelete',
    text: 'btn.ThisDelete',
    disable: false,
    visible: true,
  },
  //승인요청
  {
    id: 'btnReqApprove',
    text: 'btn.ReqApprove',
    disable: false,
    visible: true,
  },
  //승인요청취소
  {
    id: 'btnReqApproveCancel',
    text: 'btn.ReqApproveCancel',
    disable: false,
    visible: true,
  },

  //결재자 추가
  {
    id: 'btnAddApp',
    text: 'btn.AddApp',
    disable: false,
    visible: true,
    permission: true,
  },

  //참조 추가
  {
    id: 'btnAddCC',
    text: 'btn.AddCC',
    disable: false,
    visible: true,
    permission: true,
  },

  //참조 추가
  {
    id: 'btnListPrint',
    text: 'btn.ListPrint',
    disable: false,
    visible: true,
    permission: true,
  },

  //담당자 확정
  {
    id: 'btnChargerConfirm',
    text: 'btn.ChargerConfirm',
    disable: false,
    visible: true,
  },
  //산재 유첨
  {
    id: 'btnSanJeFileAdd',

    //icon: 'mdi-upload',
    text: 'btn.SanJeFileAdd',
    disable: false,
    visible: true,
  },

  //불러오기
  {
    id: 'btnDataImport',
    text: 'btn.DataImport',
    disable: false,
    visible: true,
  },
  //종결반려
  {
    id: 'btnEmployCareCancel',
    //icon: 'mdi-alert-circle-check',
    text: 'btn.EmployCareCancel',
    disable: false,
    visible: true,
  },
  //결과 통지서
  {
    id: 'btnSanJeResultFileAdd',
    //icon: 'mdi-upload',
    text: 'btn.SanJeResultFileAdd',
    disable: false,
    visible: true,
  },

  //협력사 확정
  {
    id: 'btnVendorConfirm',
    text: 'btn.VendorConfirm',
    disable: false,
    visible: true,
  },

  //협력사 확정 취소
  {
    id: 'btnVendorCancelConfirm',
    text: 'btn.VendorCancelConfirm',
    disable: false,
    visible: true,
  },

  //검토 취소
  {
    id: 'btnCancelFinish',
    text: 'btn.CancelFinish',
    disable: false,
    visible: true,
  },

  //미 병행작업 일괄승인
  {
    id: 'btnPOBA',
    text: 'btn.POBA',
    disable: false,
    visible: true,
    permission: true,
  },

  // 개별 허가
  {
    id: 'btnIndividualPermit',
    text: 'btn.IndividualPermit',
    disable: false,
    visible: true,
    permission: true,
  },

  // 총괄담당자확정
  {
    id: 'btnGeneralManagerConfirm',
    text: 'btn.GeneralManagerConfirm',
    disable: false,
    visible: true,
  },
  // 1차 작업 완료
  {
    id: 'btnFirstComplete',
    text: 'btn.FirstComplete',
    disable: false,
    visible: true,
    permission: true,
  },
  // 2차 작업 완료
  {
    id: 'btnSecondComplete',
    text: 'btn.SecondComplete',
    disable: false,
    visible: true,
    permission: true,
  },

  //대표이미지설정
  {
    id: 'btnUpdateRefImage',
    text: 'btn.UpdateRefImage',
    disable: false,
    visible: true,
    permission: true,
  },

  // 총괄담당자확정취소
  {
    id: 'btnGeneralManagerCancelConfirm',
    text: 'btn.GeneralManagerCancelConfirm',
    disable: false,
    visible: true,
  },
  //안전확인(안전 - 안전사고 등록/현황 보고서)
  {
    id: 'btnSafetyCancel',
    text: 'btn.SafetyCancel',
    disable: false,
    visible: true,
    permission: true,
  },
  /* 2차 개발 화면에 사용되는 버튼리스트는 여기 아래에 추가해주세요 *******************************************************************/

  // SLI접기
  {
    id: 'btnFold',
    text: 'btn.Fold',
    disable: false,
    visible: true,
    permission: true,
  },
  // SLI펼치기
  {
    id: 'btnExpand',
    text: 'btn.Expand',
    disable: false,
    visible: true,
    permission: true,
  },
  // SLI 부서 상세보기
  {
    id: 'btnSliDetail',
    text: 'btn.SliDetail',
    disable: false,
    visible: true,
    permission: true,
  },
  // 나의 부서 sli 보기
  {
    id: 'btnSliMyDetail',
    text: 'btn.SliMyDetail',
    disable: false,
    visible: true,
    permission: true,
  },
  // 오토바이 등록번호 생성
  {
    id: 'btnCreateRegNumber',
    text: 'btn.CreateRegNumber',
    disable: false,
    visible: true,
    permission: true,
  },

  // 주소록에 인원추가
  {
    id: 'btnAddressAdd',
    text: 'btn.AddressAdd',
    disable: false,
    visible: true,
    permission: true,
  },

  // 발송대상으로 보내기
  {
    id: 'btnAddressAdd2',
    text: 'btn.AddressAdd2',
    disable: false,
    visible: true,
    permission: true,
  },
  // 인원추가
  {
    id: 'btnAddPerson',
    text: 'btn.AddPerson',
    disable: false,
    visible: true,
    permission: true,
  },
  // 인원삭제
  {
    id: 'btnDelPerson',
    text: 'btn.DelPerson',
    disable: false,
    visible: true,
    permission: true,
  },
  //교통수칙위반등록
  {
    id: 'btnRegistTrafficViolation',
    text: 'btn.RegistTrafficViolation',
    disable: false,
    visible: true,
    permission: true,
  },
  // 안전사고
  {
    id: 'btnInternalApply',
    text: 'btn.InternalApply',
    disable: false,
    visible: true,
    permission: true,
  },
  //평가수정
  {
    id: 'btnEditEval',
    text: 'btn.EditEval',
    disable: false,
    visible: true,
    permission: true,
  },
  //평가확정
  {
    id: 'btnStandardEval',
    text: 'btn.StandardEval',
    disable: false,
    visible: true,
    permission: true,
  },
  //신규평가
  {
    id: 'btnNewEval',
    text: 'btn.NewEval',
    disable: false,
    visible: true,
    permission: true,
  },

  //측정대상인자관리
  {
    id: 'btnTargetArg',
    text: 'btn.TargetArg',
    disable: false,
    visible: true,
    permission: true,
  },
  //측정대상부서선정
  {
    id: 'btnTargetDept',
    text: 'btn.TargetDept',
    disable: false,
    visible: true,
    permission: true,
  },
  //일괄다운로드
  {
    id: 'btnAllDownload',
    text: 'btn.AllDownload',
    disable: false,
    visible: true,
    permission: true,
  },
  //측정부서 가져오기
  {
    id: 'btnDeptLoad',
    text: 'btn.DeptLoad',
    disable: false,
    visible: true,
    permission: true,
  },
  //최종산출
  {
    id: 'btnFinalOutput',
    text: 'btn.FinalOutput',
    disable: false,
    visible: true,
    permission: true,
  },
  //지급 완료
  {
    id: 'btnPaymentComplete',
    text: 'btn.PaymentComplete',
    disable: false,
    visible: true,
  },
  //개인별 지급이력
  {
    id: 'btnPersonalHistorySearch',
    text: 'btn.PersonalHistorySearch',
    disable: false,
    visible: true,
  },
  //성분 및 유해성 평가 확인
  {
    id: 'btnHazardEvaluation',
    text: 'btn.HazardEvaluation',
    disable: false,
    visible: true,
  },
  //사용팀 수정
  {
    id: 'btnTeamUpdate',
    text: 'btn.TeamUpdate',
    disable: false,
    visible: true,
  },
  //경보표지 수정
  {
    id: 'btnAlarmSignUpdate',
    text: 'btn.AlarmSignUpdate',
    disable: false,
    visible: true,
  },
  //데이터 받기
  {
    id: 'btnDataDownload',
    text: 'btn.DataDownload',
    disable: false,
    visible: true,
  },
  //기상정보확인
  {
    id: 'btnWeatherInfo',
    text: 'btn.WeatherInfo',
    disable: false,
    visible: true,
  },
  //작성가이드
  {
    id: 'btnWriteGuide',
    text: 'btn.WriteGuide',
    disable: false,
    visible: true,
  },
  //시트정보copy
  {
    id: 'btnSheetInfoCopy',
    text: 'btn.btnSheetInfoCopy',
    disable: false,
    visible: true,
  },
  // 모바일 앨범
  // 2025.09.19 윤찬양책임 요청으로 명칭을 모바일앨범->하이세스앨범으로 변경
  {
    id: 'btnMobileAlbum',
    text: 'btn.HiSEsAlbum',
    disable: false,
    visible: true,
    permission: true,
  },
  // 산출
  {
    id: 'btnCalculation',
    text: 'btn.Calculation',
    disable: false,
    visible: true,
  },
  // 계산
  {
    id: 'btnCalculate',
    text: 'btn.Calculate',
    disable: false,
    visible: true,
  },
  // 이관
  {
    id: 'btnShift',
    text: 'btn.Shift',
    disable: false,
    visible: true,
  },
  // 제외 취소
  {
    id: 'btnUnexclude',
    text: 'btn.Unexclude',
    disable: false,
    visible: true,
  },
  // MSDS 교육 안내서
  {
    id: 'btnMSDSEduGuide',
    text: 'btn.MSDSEduGuide',
    disable: false,
    visible: true,
  },
  // 시스템 사용 매뉴얼
  {
    id: 'btnSystemUseGuide',
    text: 'btn.SystemUseGuide',
    disable: false,
    visible: true,
  },
  // 교육일정 일괄 등록
  {
    id: 'btnRegisterEduDate',
    text: 'btn.RegisterEduDate',
    disable: false,
    visible: true,
  },
  //태풍발령 문자 발송
  {
    id: 'btnTypnSMS',
    text: 'btn.TypnSMS',
    disable: false,
    visible: true,
    // permission: true,
  },
  //GIS기반 태풍 피해현황
  {
    id: 'btnTypnDamage',
    text: 'btn.TypnDamage',
    disable: false,
    visible: true,
    permission: true,
  },
  //내용보기
  {
    id: 'btnContent',
    text: 'btn.Content',
    disable: false,
    visible: true,
    permission: true,
  },
  //발송이력
  {
    id: 'btnSendHis',
    text: 'btn.SendHis',
    disable: false,
    visible: true,
    permission: true,
  },
  //유틸리티 라인 MSDS
  {
    id: 'btnUtilityLineMSDS',
    text: 'btn.UtilityLineMSDS',
    disable: false,
    visible: true,
    permission: true,
  },
  //작업 공정별 관리 요령
  {
    id: 'btnWorkProcessManagementTips',
    text: 'btn.WorkProcessManagementTips',
    disable: false,
    visible: true,
    permission: true,
  },
  //입고 이력
  {
    id: 'btnReceivingHistory',
    text: 'btn.ReceivingHistory',
    disable: false,
    visible: true,
    permission: true,
  },
  // 유해성 평가 보기
  {
    id: 'btnHazardAssessment',
    text: 'btn.HazardAssessment',
    disable: false,
    visible: true,
    permission: true,
  },
  // 아르곤
  {
    id: 'btnArgon',
    text: 'btn.Argon',
    disable: false,
    visible: true,
    permission: true,
  },
  // 산소
  {
    id: 'btnOxygen',
    text: 'btn.Oxygen',
    disable: false,
    visible: true,
    permission: true,
  },
  // 인산화탄소
  {
    id: 'btnCarbonDioxide',
    text: 'btn.CarbonDioxide',
    disable: false,
    visible: true,
    permission: true,
  },
  // 에틸렌
  {
    id: 'btnEthylene',
    text: 'btn.Ethylene',
    disable: false,
    visible: true,
    permission: true,
  },
  // 아세틸렌
  {
    id: 'btnAcetylene',
    text: 'btn.Acetylene',
    disable: false,
    visible: true,
    permission: true,
  },
  // LNG(도시가스)
  {
    id: 'btnLiquefiedNaturalGas',
    text: 'btn.LiquefiedNaturalGas',
    disable: false,
    visible: true,
    permission: true,
  },
  // 발송이력조회
  {
    id: 'btnSendSearch',
    text: 'btn.SendSearch',
    disable: false,
    visible: true,
    permission: true,
  },
  // 신규 작업 추가
  {
    id: 'btnNewAddWork',
    text: 'btn.NewAddWork',
    disable: false,
    visible: true,
  },
  // 신규 조사
  {
    id: 'btnNewInvestigation',
    text: 'btn.NewInvestigation',
    disable: false,
    visible: true,
  },
  // 사실통지
  {
    id: 'btnNoticeFact',
    text: 'btn.NoticeFact',
    disable: false,
    visible: true,
  },
  // 최종제출
  {
    id: 'btnFinalSubmit',
    text: 'btn.FinalSubmit',
    disable: false,
    visible: true,
  },
  // 사전점검 결과 출력
  {
    id: 'btnPreChkResPrint',
    text: 'btn.PreChkResPrint',
    disable: false,
    visible: true,
    permission: true,
  },
  // 엑셀 다운
  {
    id: 'btnExcelDown',
    text: 'btn.ExcelDown',
    disable: false,
    visible: true,
    permission: true,
  },
  // 자체 검토 내역 확인
  {
    id: 'btnCheckHistory',
    text: 'btn.CheckHistory',
    disable: false,
    visible: true,
  },
  // 신규 직무 조회
  {
    id: 'btnNewJobSearch',
    text: 'btn.NewJobSearch',
    disable: false,
    visible: true,
  },
  // 신규 부서 조회
  {
    id: 'btnNewDeptSearch',
    text: 'btn.NewDeptSearch',
    disable: false,
    visible: true,
  },
  // 전체 현황 조회
  {
    id: 'btnTotalStatusSearch',
    text: 'btn.TotalStatusSearch',
    disable: false,
    visible: true,
  },
  // 공정설비별 인허가 상세
  {
    id: 'btnProcessSearch',
    text: 'btn.ProcessSearch',
    disable: false,
    visible: true,
    permission: true,
  },
  // 신규/변경 등록
  {
    id: 'btnRegisterModify',
    text: 'btn.RegisterModify',
    disable: false,
    visible: true,
    // permission: true,
  },
  //용접재추가
  {
    id: 'btnMate',
    text: 'btn.btnMate',
    disable: false,
    visible: true,
    permission: true,
  },
  // 오류내역
  {
    id: 'btnErrChk',
    text: 'btn.ErrChk',
    disable: false,
    visible: true,
    permission: true,
  },
  // 수령정보저장
  {
    id: 'btnReceiveSave',
    text: 'btn.ReceiveSave',
    disable: false,
    visible: true,
    permission: true,
  },
  // 접종종류관리
  {
    id: 'btnVtm',
    text: 'btn.btnVtm',
    disable: false,
    visible: true,
    permission: true,
  },
  // 대상 조직 설정
  {
    id: 'btnTargetOrganizationSettings',
    text: 'btn.TargetOrganizationSettings',
    disable: false,
    visible: true,
    permission: true,
  },
  // 데이터 일괄 연결
  {
    id: 'btnBatchDataConnection',
    text: 'btn.BatchDataConnection',
    disable: false,
    visible: true,
    permission: true,
  },
  // 개별 데이터 이관
  {
    id: 'btnIndividualDataMigration',
    text: 'btn.IndividualDataMigration',
    disable: false,
    visible: true,
    permission: true,
  },
  // 산출 기준 생성
  {
    id: 'btnGeneratingTheCalculationCriteria',
    text: 'btn.GeneratingTheCalculationCriteria',
    disable: false,
    visible: true,
    permission: true,
  },
  // 양식 내려받기
  {
    id: 'btnDownloadingAForm',
    text: 'btn.DownloadingAForm',
    disable: false,
    visible: true,
    permission: true,
  },
  // 양식 업로드
  {
    id: 'btnUploadForm',
    text: 'btn.UploadForm',
    disable: false,
    visible: true,
    permission: true,
  },
  // 과거자료 복사
  {
    id: 'btnCopyHistoricalData',
    text: 'btn.CopyHistoricalData',
    disable: false,
    visible: true,
    permission: true,
  },
  // 위험성 산출
  {
    id: 'btnCalculationOfRisk',
    text: 'btn.CalculationOfRisk',
    disable: false,
    visible: true,
    permission: true,
  },
  // 안전화 정보
  {
    id: 'btnShoesInfo',
    text: 'btn.ShoesInfo',
    disable: false,
    visible: true,
  },
  // 안전장화 정보
  {
    id: 'btnLongShoesInfo',
    text: 'btn.LongShoesInfo',
    disable: false,
    visible: true,
  },
  // 도수보안경 정보
  {
    id: 'btnGlassesInfo',
    text: 'btn.GlassesInfo',
    disable: false,
    visible: true,
  },
  // 정기 지급 일괄 업로드
  {
    id: 'btnRegularBulkUpload',
    text: 'btn.RegularBulkUpload',
    disable: false,
    visible: true,
  },
  // 수시 신청 업로드
  {
    id: 'btnNonRegularBulkUpload',
    text: 'btn.NonRegularBulkUpload',
    disable: false,
    visible: true,
  },
  // 일정적용
  {
    id: 'btnScheduleApply',
    text: 'btn.ScheduleApply',
    disable: false,
    visible: true,
  },
  // 일정수립
  {
    id: 'btnScheduleEstablishment',
    text: 'btn.ScheduleEstablishment',
    disable: false,
    visible: true,
  },
  // 일정통보출력
  {
    id: 'btnScheduleNoticePrint',
    text: 'btn.ScheduleNoticePrint',
    disable: false,
    visible: true,
  },
  // 지급 처리
  {
    id: 'btnPayProcess',
    text: 'btn.PayProcess',
    disable: false,
    visible: true,
  },
  // 이관 내역 삭제 DeleteTransferHistory
  {
    id: 'btnDeleteTransferHistory',
    text: 'btn.DeleteTransferHistory',
    disable: false,
    visible: true,
    permission: true,
  },
  //이전단계
  {
    id: 'btnPrevStep',
    text: 'btn.PrevStep',
    disable: false,
    visible: true,
    permission: true,
  },
  //다음단계
  {
    id: 'btnNextStep',
    text: 'btn.NextStep',
    disable: false,
    visible: true,
    permission: true,
  },
  //조사완료
  {
    id: 'btnInvComplete',
    text: 'btn.InvComplete',
    disable: false,
    visible: true,
    permission: true,
  },
  // 사번 가져오기
  {
    id: 'btnGetEmpno',
    text: 'btn.GetEmpno',
    disable: false,
    visible: true,
  },
  // 외부인사/기타
  {
    id: 'btnExternal',
    text: 'btn.External',
    disable: false,
    visible: true,
    permission: true,
  },
  {
    id: 'btnSystemManual',
    text: 'btn.SystemManual',
    disable: false,
    visible: true,
    permission: true,
  },
  // 건강관리위험대상자 가이드
  {
    id: 'btnRiskEmpGuide',
    text: 'btn.RiskEmpGuide',
    disable: false,
    visible: true,
    permission: true,
  },
  // 시스템매뉴얼
  {
    id: 'btnSystemManual',
    text: 'btn.SystemManual',
    disable: false,
    visible: true,
    permission: true,
  },
  // 관리대상자 추가
  {
    id: 'btnAddManage',
    text: 'btn.AddManage',
    disable: false,
    visible: true,
  },
  // 오류신고 및 개선의뢰
  {
    id: 'btnErrorRequest',
    text: 'btn.ErrorRequest',
    disable: false,
    visible: true,
    permission: true,
  },
  // 과거 조정기준 가져오기
  {
    id: 'btnGetPastCorrectionCriteria',
    text: 'btn.GetPastCorrectionCriteria',
    disable: false,
    visible: true,
    permission: true,
  },
  // 협력사 추가
  {
    id: 'btnAddVend',
    text: 'btn.AddVend',
    disable: false,
    visible: true,
  },
  // 특수건강진단결과 업로드
  {
    id: 'btnUploadSpecialHealthCheckupResults',
    text: 'btn.UploadSpecialHealthCheckupResults',
    disable: false,
    visible: true,
    permission: true,
  },
  // 일괄 지급 처리
  {
    id: 'btnBatchPayment',
    text: 'btn.BatchPayment',
    disable: false,
    visible: true,
  },
  // 긴급 승인
  {
    id: 'btnEmergencyApprove',
    text: 'btn.EmergencyApprove',
    disable: false,
    visible: true,
  },
  // 기타 추가
  {
    id: 'btnAddEtc',
    text: 'btn.AddEtc',
    disable: false,
    visible: true,
  },
  // 개인정보동의서 첨부
  {
    id: 'btnPersonalInfo',
    text: 'btn.PersonalInfo',
    disable: false,
    visible: true,
  },
  // 계획 등록
  {
    id: 'btnAddPlan',
    text: 'btn.AddPlan',
    disable: false,
    visible: true,
  },
  // 실적 등록
  {
    id: 'btnAddPerform',
    text: 'btn.AddPerform',
    disable: false,
    visible: true,
  },
  //신규(수시평가)
  {
    id: 'btnNewRegular',
    text: 'btn.NewRegular',
    disable: false,
    visible: true,
  },
  //근로자 수 추가
  {
    id: 'btnWorkerCnt',
    text: 'btn.WorkerCnt',
    disable: false,
    visible: true,
  },
  // 관리목록 다운로드
  {
    id: 'btnManageDownload',
    text: 'btn.ManageDownload',
    disable: false,
    visible: true,
    permission: true,
  },
  // MSDS 일괄 다운로드
  {
    id: 'btnMsdsAllDownload',
    text: 'btn.MsdsAllDownload',
    disable: false,
    visible: true,
    permission: true,
  },
  //행그룹핑
  {
    id: 'btnRowGrouping',
    text: 'btn.RowGrouping',
    disable: false,
    visible: true,
  },
  // 양식다운로드(권한 추가 삭제가능한 버튼)
  {
    id: 'btnExcelFormDownload',
    text: 'btn.ExcelFormDownload',
    disable: false,
    visible: true,
  },
  // 부서작업표준가져오기
  {
    id: 'btnGetDeptWorkStandard',
    text: 'btn.GetDeptWorkStandard',
    disable: false,
    visible: true,
  },
  // 세부 보정
  {
    id: 'btnDetailAdjust',
    text: 'btn.DetailAdjust',
    disable: false,
    visible: true,
  },
  // 인사정보 가져오기
  {
    id: 'btnGetHrInfo',
    text: 'btn.GetHrInfo',
    disable: false,
    visible: true,
  },
  // 적용(권한 부여해야 함)
  {
    id: 'btnApplicate',
    text: 'btn.Applicate',
    disable: false,
    visible: true,
  },
  // 화학물질 규제 기준 확인
  {
    id: 'btnRegulatoryStandards',
    text: 'btn.RegulatoryStandards',
    disable: false,
    visible: true,
  },
  // 화학물질 취급 안내 자료
  {
    id: 'btnHandlingGuide',
    text: 'btn.HandlingGuide',
    disable: false,
    visible: true,
  },

  // 부서 화학물질 관리 축소 버튼
  {
    id: 'btnMSDSCollapse',
    text: 'btn.MSDSCollapse',
    disable: false,
    visible: true,
    permission: true,
  },

  // 부서 화학물질 관리 확장 버튼
  {
    id: 'btnMSDSExpand',
    text: 'btn.MSDSExpand',
    disable: false,
    visible: true,
    permission: true,
  },
  //엑셀 양식 다운로드
  {
    id: 'btnExcelFormDown',
    text: 'btn.ExcelFormDown',
    disable: false,
    visible: true,
    permission: true,
  },
  //등록취소
  {
    id: 'btnRegistCancel',
    text: 'btn.RegistCancel',
    disable: false,
    visible: true,
  },
  // 설비등급평가표 출력
  {
    id: 'btnProcessGrade',
    text: 'btn.ProcessGrade',
    disable: false,
    visible: true,
  },
  // 설비이력카드 출력
  {
    id: 'btnProcessHistory',
    text: 'btn.ProcessHistory',
    disable: false,
    visible: true,
  },
  //조사완료취소
  {
    id: 'btnInvCompleteCancel',
    text: 'btn.InvCompleteCancel',
    disable: false,
    visible: true,
  },
  //저장 및 검토요청
  {
    id: 'btnSaveReview',
    text: 'btn.SaveReview',
    disable: false,
    visible: true,
  },
  //저장 및 기안
  {
    id: 'btnSaveDraft',
    text: 'btn.SaveDraft',
    disable: false,
    visible: true,
  },
  //조사내용삭제
  {
    id: 'btnInvDelete',
    text: 'btn.InvDelete',
    disable: false,
    visible: true,
  },
  //기초건강정보 등록
  {
    id: 'btnBaseHealthAdd',
    text: 'btn.BaseHealthAdd',
    disable: false,
    visible: true,
  },
  // 지급 대상
  {
    id: 'btnPaymentTarget',
    text: 'btn.PaymentTarget',
    disable: false,
    visible: true,
  },
  // 지급 비대상
  {
    id: 'btnPaymentNonTarget',
    text: 'btn.PaymentNonTarget',
    disable: false,
    visible: true,
  },
  // 통합관제센터 업무일지(사고/출동 현황)
  {
    id: 'btnDispatchStatus',
    text: 'btn.DispatchStatus',
    disable: false,
    visible: true,
  },
  //데이터 업로드
  {
    id: 'btnDataUpload',
    text: 'btn.DataUpload',
    disable: false,
    visible: true,
    permission: true,
  },
  // 지표정의
  {
    id: 'btnIndicator',
    text: 'btn.Indicator',
    disable: false,
    visible: true,
    permission: true,
  },
  // 아차사고/위험제보 등록/현황
  {
    id: 'btnNmi',
    text: 'btn.Nmi',
    disable: false,
    visible: true,
  },
  // 폭발위험도산출 테스트
  {
    id: 'btnExpcalctest',
    text: 'btn.Expcalctest',
    disable: false,
    visible: true,
  },
  // 계산
  {
    id: 'btnCalculatetest',
    text: 'btn.Calculatetest',
    disable: false,
    visible: true,
  },
  // 검사 장비 저장
  {
    id: 'btnInspectionEquip',
    text: 'btn.InspectionEquip',
    disable: false,
    visible: true,
  },
  //출력취소
  {
    id: 'btnCancelPrint',
    text: 'btn.CancelPrint',
    disable: false,
    visible: true,
  },
  // 반납
  {
    id: 'btnReturn',
    text: 'btn.Return',
    disable: false,
    visible: true,
  },
]
