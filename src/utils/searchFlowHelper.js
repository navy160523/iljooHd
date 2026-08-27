import Message from '@hiway/utils/notify'

export default class searchFlowHelper {


  constructor(view, t) {

    this.vm = view  //컨펌메세지
    this.gridList = []  //조회시 수정중 데이터 확인
    this.searchArea = null  //조회조건 validation 확인용, 마스터 디테일에서 디테일 조회시는 null 설정하여 체크 안함
    this.useDefaultBefore = true  //조회전 디폴트 사용여부
    this.messageYn = true //조회후 디폴트 사용여부
    this.resultMessage = '조회되었습니다.' //결과 메세지

    this.userBefore = null //조회전 사용자정의 체크함수
    this.userAfter = null //조회후 사용자정의 체크함수
    this.query = Function  //조회함수
    this.t = t  //다국어
  }
  

  //조회시 수정중 데이터 확인용 그리드 셋팅
  setGridList = arrGrid => {
    this.gridList = [...arrGrid]

    return this
  }
  
  setSearchArea = searchArea => {
    this.searchArea = searchArea

    return this
  }

  //조회함수 셋팅
  setQuery = (action, param = null) => {

    this.query = () => { return action(param) }

    return this
  }
  
  //조회전 사용자정의 체크함수 셋팅
  setBefore = action => {
    this.userBefore = action

    return this
  }

  //조회전 사용자정의 체크함수 셋팅
  setAfter = action => {
    this.userAfter = action

    return this
  }

  //결과 메세지 변경하고 싶을 때
  setResultMessage = message => {
    this.resultMessage = message

    return this
  }
  
  setUseDefaultBefore = useYn => {
    this.useDefaultBefore = useYn  //조회전 디폴트 사용여부
    
    return this
  }

  showMessage = useYn => {
    this.messageYn = useYn  //조회전 디폴트 사용여부
    
    return this
  }

  //조회전 디폴트 체크
  defaultBeforeSearch = async () => {

    let isValidate = { valid: true }

    if (this.searchArea)
    {
      isValidate = await this.searchArea.value.validate()
    }

    if (!isValidate.valid) {
      Message.warn(this.t('조회조건을 확인하세요'))
      return false
    }
    
    return true
  }

  // 그리드 데이터 수정중 여부 및 확인
  ignoreChange = async () => {
    
    let isGridChanged = false

    //그리드 데이터 수정중 여부 확인
    for (const grid of this.gridList) {

      if (!grid.value) {
        return false
      }

      grid.value.getGridView().commit()
      if (grid.value.getDataProvider().getRowStateCount('*') > 0) {
        isGridChanged = true
        break
      }
    }

    if (isGridChanged) 
    {
      let res = await this.vm.$swal({ 
        title: this.t("수정중인 데이터가 있습니다. 조회하시겠습니까?"), 
        showCancelButton: true,
      })
      
      if (!res.isConfirmed) {
        return false
      }
    }

    return true
  }

  setPreRow = () => {
    this.gridList.forEach(grid => {      
      grid.value.setPreRow()      
    })
  }

  //조회후 이전 데이터로 포커스 이동
  movePreRow = () => {    
    this.gridList.forEach(grid => {        
      grid.value.movePreRow()      
    })
  }

  run = async () => {

    // 디폴트 체크 (데이터 변경여부, 조회조건 validation)
    if (this.useDefaultBefore) 
    {
      if (!await this.defaultBeforeSearch()) 
        return
    }

    // 사용자 정의 validation
    if (this.userBefore) 
    {
      if (!await this.userBefore())
        return
    }

    // 변경된 데이터 확인
    if (!await this.ignoreChange()) 
      return

    // 현재 포커스된 행 저장
    this.setPreRow()

    this.query().then(res => {

      for(let item in res){
        if(item.indexOf('ORESULT_CUR') != -1){

          // 조회 데이터 없을시 출력 message
          if( res[item].length === 0){
            this.resultMessage = '데이터가 없습니다.'
          }
        }
      }

      if(this.messageYn && this.resultMessage === '데이터가 없습니다.'){
        Message.warn(this.t(this.resultMessage))
      } else if(this.messageYn) {
        Message.success(this.t(this.resultMessage))
      }

      // if (this.messageYn) {
      //   Message.success(this.t(this.resultMessage))
      // }

      if (this.userAfter) {
        this.userAfter(res)
      }
      
      // 저장된 행으로 이동
      //저장된 행과 일치하는 데이터가 없으면 첫번째 행
      this.movePreRow()
  
    }).catch(err => {
      //Message.err(err)
    }).finally(() => {
      // console.log('finally')
    })
  }

}