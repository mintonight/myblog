import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const POSTS_DIR = "src/content/posts";
const IMAGES_DIR = "src/content/posts/images";

// 确保 images 目录存在
if (!fs.existsSync(IMAGES_DIR)) {
	fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function generateSvg(title, width = 1200, height = 630) {
	// 计算字体大小，标题越长字体越小
	let fontSize = 72;
	if (title.length > 20) fontSize = 60;
	if (title.length > 30) fontSize = 48;
	if (title.length > 50) fontSize = 40;

	return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  <text x="50%" y="50%" font-family="Microsoft YaHei, 微软雅黑, sans-serif" font-size="${fontSize}" font-weight="700"
        fill="#333333" text-anchor="middle" dominant-baseline="middle">
    ${escapeXml(title)}
  </text>
</svg>`;
}

function escapeXml(str) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

async function processPost(filePath) {
	const content = fs.readFileSync(filePath, "utf-8");

	// 解析 frontmatter
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		console.log(`跳过 ${filePath}: 无 frontmatter`);
		return;
	}

	const frontmatter = match[1];

	// 提取 title
	const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
	if (!titleMatch) {
		console.log(`跳过 ${filePath}: 无 title`);
		return;
	}

	let title = titleMatch[1].trim();
	// 去掉引号
	if ((title.startsWith('"') && title.endsWith('"')) || (title.startsWith("'") && title.endsWith("'"))) {
		title = title.slice(1, -1);
	}

	// 特殊文章封面标题
	const customTitles = {
		"AI模型真伪判别": "ai真伪判别",
		"双系统时间冲突问题解决方案": "双系统时间冲突",
		"模型训练环境配置问题": "pi0模型训练",
	};
	if (customTitles[title]) {
		title = customTitles[title];
	}

	// 检查是否已有非生成的封面
	const imageMatch = frontmatter.match(/^image:\s*(.+)$/m);
	if (imageMatch) {
		const existingImage = imageMatch[1].trim();
		if (existingImage && existingImage !== "''" && existingImage !== '""' && !existingImage.includes('-cover.png')) {
			console.log(`跳过 ${filePath}: 已有封面 ${existingImage}`);
			return;
		}
	}

	// 生成封面
	const postName = path.basename(filePath, path.extname(filePath));
	const imageName = `${postName}-cover.png`;
	const imagePath = path.join(IMAGES_DIR, imageName);
	const svg = generateSvg(title);

	await sharp(Buffer.from(svg)).png().toFile(imagePath);

	console.log(`生成封面: ${imagePath}`);

	// 更新 frontmatter
	const imageField = `image: './images/${imageName}'`;
	let newContent;
	if (imageMatch) {
		// 替换已有的空 image 字段
		newContent = content.replace(/^image:\s*(.*)$/m, imageField);
	} else {
		// 在 frontmatter 中添加 image 字段
		newContent = content.replace("---\n", `---\n${imageField}\n`);
	}

	fs.writeFileSync(filePath, newContent, "utf-8");
	console.log(`更新 frontmatter: ${filePath}`);
}

async function main() {
	const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

	console.log(`找到 ${files.length} 篇文章\n`);

	for (const file of files) {
		await processPost(path.join(POSTS_DIR, file));
	}

	// 处理子目录中的 index.md
	const dirs = fs.readdirSync(POSTS_DIR).filter((f) => {
		const stat = fs.statSync(path.join(POSTS_DIR, f));
		return stat.isDirectory();
	});

	for (const dir of dirs) {
		const indexPath = path.join(POSTS_DIR, dir, "index.md");
		if (fs.existsSync(indexPath)) {
			await processPost(indexPath);
		}
	}

	console.log("\n完成!");
}

main().catch(console.error);
