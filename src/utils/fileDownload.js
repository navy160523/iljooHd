import Message from '@hiway/utils/notify'

export default function fileDown(value) {

  const file = value.contentDisposition.split('fileName=')
  const fileFullName = file[1].split('.')
  let fileType = null

  if(fileFullName[1] === 'png') {
    fileType = 'image/png'
  } else if(fileFullName[1] === 'gif'){
    fileType = 'image/gif'
  } else if(fileFullName[1] === 'htm' || fileFullName[1] === 'html'){
    fileType = 'text/html'
  } else if(fileFullName[1] === 'jpeg' || fileFullName[1] === 'jpg'){
    fileType = 'image/jpg'
  } else if(fileFullName[1] === 'pdf'){
    fileType = 'application/pdf'
  } else if(fileFullName[1] === 'ppt'){
    fileType = 'application/vnd.ms-powerpoint'
  } else if(fileFullName[1] === 'txt'){
    fileType = 'text/plain'
  } else if(fileFullName[1] === 'xls'){
    fileType = 'application/vnd.ms-excel'
  } else if(fileFullName[1] === 'xlsx'){
    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  } else if(fileFullName[1] === 'zip'){
    fileType = 'application/zip'
  } else {
    fileType = value.type
  }

  const blob = new Blob([value], { type: fileType })
  const link = document.createElement('a')

  link.href = URL.createObjectURL(blob)
  link.download = fileFullName[0]
  link.click()
  URL.revokeObjectURL(link.href)
  
}