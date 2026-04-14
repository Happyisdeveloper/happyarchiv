const path = require('path')
const fs = require('fs')

async function exportToSite(archiveData, app) {
  // Her zaman projenin kök klasörünü bul
  let projectDir
  if (app.isPackaged) {
    projectDir = process.resourcesPath
  } else {
    // npm start ile çalışırken app.getAppPath() proje klasörünü verir
    projectDir = app.getAppPath()
  }

  const siteDir = path.join(projectDir, 'site')
  const mediaDir = path.join(siteDir, 'media')

  console.log('Site klasörü:', siteDir)

  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true })
  if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true })

  const { allTags, folderTree, files } = archiveData
  const publishedFiles = files.filter(f => f.published !== false)

  const exportedFiles = []
  for (const f of publishedFiles) {
    const exportedMedia = []
    for (const m of (f.media || [])) {
      if (m.localPath && fs.existsSync(m.localPath)) {
        const ext = path.extname(m.name)
        const fileName = `${f.id}_${exportedMedia.length}${ext}`
        const destPath = path.join(mediaDir, fileName)
        fs.copyFileSync(m.localPath, destPath)
        exportedMedia.push({ name: m.name, webPath: `media/${fileName}` })
      }
    }
    exportedFiles.push({
      id: f.id, name: f.name, folder: f.folder,
      tags: f.tags || [], date: f.date, size: f.size,
      media: exportedMedia, published: true
    })
  }

  const exportData = {
    allTags, folderTree,
    files: exportedFiles,
    exportedAt: new Date().toISOString()
  }

  const dataJs = `window.__ARCHIVE_DATA__ = ${JSON.stringify(exportData, null, 2)};`
  fs.writeFileSync(path.join(siteDir, 'data.js'), dataJs, 'utf8')

  return {
    success: true,
    siteDir,
    fileCount: exportedFiles.length,
    mediaCount: exportedFiles.reduce((s, f) => s + f.media.length, 0)
  }
}

module.exports = { exportToSite }
