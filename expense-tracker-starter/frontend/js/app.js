// Expense Tracker - frontend logic

const tableBody = document.getElementById("expensesTableBody");
const spinner = document.getElementById("spinner");

let currentId = null;
//يعرض البيانات الي بالداتا أول ما اعرض الصفحة
document.addEventListener("DOMContentLoaded", () => {
   initChart();
  refresh(); // تحميل البيانات لأول مرة
  

  const filterSelect = document.getElementById("filterCategory");
  if (filterSelect) {
    filterSelect.addEventListener("change", applyFilter);
  }
});

function showSpinner() {
  if (spinner) spinner.classList.remove("d-none");
}

function hideSpinner() {
  if (spinner) spinner.classList.add("d-none");
}

async function getExpenses() {
  try {
    showSpinner();
    const res = await fetch("http://localhost:3000/api/expenses");
    if (!res.ok) {
      throw new Error("Please check the URL again");
    }
    const expenses = await res.json();
    updateCards(expenses);
    tableBody.innerHTML = "";
    // إذا كانت القائمة فارغة
    if (expenses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">There are no current expenses right now</td>
        </tr>
      `;
      return;
    } else {
      expenses.forEach((expense) => {
        const tr = document.createElement("tr");
        const badgeColor = getCategoryByBadgeClass(expense.category);
        tr.innerHTML = `
        <td>${expense.title}</td>
        <td> ${expense.amount}</td>
        <td><span class="badge ${badgeColor}">${expense.category}</span></td>
        <td> ${expense.date}</td>
        <td>
        <button class="btn btn-sm btn-outline-info" onclick="openEditModal(${expense.id}, '${expense.title}', ${expense.amount}, '${expense.category}', '${expense.date}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${expense.id})">Delete</button>
        
        </td>
        `;

        tableBody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    alert("Something went wrong while fetching data" + error.message);
  } finally {
    hideSpinner();
  }
}

function openEditModal(id, title, amount, category, date) {
  currentId = id;

  document.getElementById("editTitleInput").value = title;
  document.getElementById("editAmountInput").value = amount;
  document.getElementById("editCategoryInput").value = category;
  document.getElementById("editDateInput").value = date;

  const editModal = new bootstrap.Modal(document.getElementById("editModal"));
  editModal.show();
}
const editForm = document.getElementById("editForm");

if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("editTitleInput");
    const amountInput = document.getElementById("editAmountInput");
    const categoryInput = document.getElementById("editCategoryInput");
    const dateInput = document.getElementById("editDateInput");
    const amountError = document.getElementById("editAmountError");

    const parsedAmount = parseFloat(amountInput.value);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      if (amountError) {
        amountError.textContent = "The number must be more than 0";
        amountError.classList.remove("d-none");
      }
      return;
    } else {
      if (amountError) amountError.classList.add("d-none");
    }

    const updatedData = {
      title: titleInput.value,
      amount: parsedAmount,
      category: categoryInput.value,
      date: dateInput.value,
    };

    if (currentId) {
      await updateExpense(currentId, updatedData);

      // إغلاق الـ Modal بعد نجاح التعديل
      const editModalEl = document.getElementById("editModal");
      const modalInstance = bootstrap.Modal.getInstance(editModalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  });
}

function getCategoryByBadgeClass(category) {
  switch (category) {
    case "Food":
      return "bg-success";
    case "Transport":
      return "bg-primary"; // أزرق
    case "Bills":
      return "bg-warning"; // أحمر
    case "Entertainment":
      return "bg-danger"; // أصفر
    case "Others":
      return "bg-secondary"; // رمادي
    default:
      return "bg-dark";
  }
}

function updateCards(expenses) {
  const totalAmountEl = document.getElementById("totalAmount");
  const totalCountEl = document.getElementById("totalCount");
  const highestExpenseEl = document.getElementById("highestExpense");
  const expenseNameEl = document.getElementById("expenseName");

  if (!expenses || expenses.length === 0) {
    totalAmountEl.textContent = "$0.00";
    totalCountEl.textContent = "0";
    highestExpenseEl.textContent = "$0.00";
    return;
  }

  const totalSum = expenses.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0,
  );
  const count = expenses.length;

  const highestExpenseObj = expenses.reduce((prev, current) => {
    return parseFloat(current.amount || 0) > parseFloat(prev.amount || 0)
      ? current
      : prev;
  });

  const maxAmount = parseFloat(highestExpenseObj.amount);
  const expenseName =
    highestExpenseObj.title || highestExpenseObj.name || "N/A";

  totalAmountEl.textContent = `$${totalSum}`;
  totalCountEl.textContent = count;
  highestExpenseEl.textContent = `$${maxAmount}`;
  expenseNameEl.textContent = expenseName;
}

const expenseForm = document.getElementById("expenseForm");
expenseForm.addEventListener("submit", async (e) => {
  //امنع الصفحة انها تحمل تلقائيا
  e.preventDefault();
  const title = document.getElementById("titleInput");
  const amount = document.getElementById("amountInput");
  const category = document.getElementById("categoryInput");
  const date = document.getElementById("dateInput");
  const amountError = document.getElementById("amountError");
  const parsedAmount = parseFloat(amount.value);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    if (amountError) {
      amountError.textContent = "Amount must be greater than zero.";
      amountError.classList.remove("d-none");
    }
    return; // إيقاف تنفيذ الدالة وعدم الإرسال
  } else {
    if (amountError) {
      amountError.classList.add("d-none");
    }
  }
  const newExpense = {
    title: title.value,
    amount: parseFloat(amount.value),
    category: category.value,
    date: date.value,
  };

  await addExpense(newExpense);

  // يفرغ الحقول بعد عملية الإضافة
  expenseForm.reset();
});

async function addExpense(data) {
  try {
    showSpinner();
    const res = await fetch("http://localhost:3000/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to add expense");
    }
    await refresh();
  } catch (error) {
    console.error("Error adding expense:", error.message);
    alert("Something went error while adding an expense" + error.message);
  } finally {
    hideSpinner();
  }
}
async function updateExpense(id, data) {
  try {
    showSpinner();
    const res = await fetch(`http://localhost:3000/api/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("Failed to update expense");
    }
    await refresh();
  } catch (error) {
    console.error("Error updating expense:", error.message);
    alert("Something went error while adding an expense" + error.message);
  } finally {
    hideSpinner();
  }
}

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    showSpinner();
    const res = await fetch(`http://localhost:3000/api/expenses/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete expense");
    }
    await refresh();
  } catch (error) {
    console.error("Error deleting expense:", error.message);
    alert("Something went wrong while deleting the expense: " + error.message);
  } finally {
    hideSpinner();
  }
}

let allExpenses = [];

async function refresh() {
  try {
    showSpinner();
    const res = await fetch("http://localhost:3000/api/expenses");
    if (!res.ok) {
      throw new Error("Failed to fetch expenses");
    }
    allExpenses = await res.json();
    applyFilter();
  } catch (error) {
    console.error("Error:", error.message);
    alert("Something went wrong while fetching data: " + error.message);
  } finally {
    hideSpinner();
  }
}

function renderTable(list) {
  tableBody.innerHTML = "";

  //بحال كانت فاضية
  if (!list || list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No expenses found.</td>
      </tr>
    `;
    return;
  }

  list.forEach((expense) => {
    const tr = document.createElement("tr");
    const badgeColor = getCategoryByBadgeClass(expense.category);

    tr.innerHTML = `
        <td>${expense.title}</td>
        <td> ${expense.amount}</td>
        <td><span class="badge ${badgeColor}">${expense.category}</span></td>
        <td> ${expense.date}</td>
        <td>
        <button class="btn btn-sm btn-outline-info" onclick="openEditModal(${expense.id}, '${expense.title}', ${expense.amount}, '${expense.category}', '${expense.date}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${expense.id})">Delete</button>
        
        </td>
        `;
    tableBody.appendChild(tr);
  });
}

function renderSummary(list) {
  const totalAmountEl = document.getElementById("totalAmount");
  const totalCountEl = document.getElementById("totalCount");
  const highestExpenseEl = document.getElementById("highestExpense");
  const expenseNameEl = document.getElementById("expenseName");

  //بحال كانت القائمة فاضية ما يصير crach
  if (!list || list.length === 0) {
    if (totalAmountEl) totalAmountEl.textContent = "$0.00";
    if (totalCountEl) totalCountEl.textContent = "0";
    if (highestExpenseEl) highestExpenseEl.textContent = "$0.00";
    if (expenseNameEl) expenseNameEl.textContent = "N/A";
    return;
  }

  const totalSum = list.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0,
  );
  const count = list.length;

  const highestExpenseObj = list.reduce((prev, current) => {
    return parseFloat(current.amount || 0) > parseFloat(prev.amount || 0)
      ? current
      : prev;
  });
  totalAmountEl.textContent = `$${totalSum}`;
  totalCountEl.textContent = `${count}`;
  highestExpenseEl.textContent = `$${parseFloat(highestExpenseObj.amount)}`;
  if (expenseNameEl) expenseNameEl.textContent = highestExpenseObj.title;
}

function applyFilter() {
  const filterSelect = document.getElementById("filterCategory");
  const selectedCategory = filterSelect ? filterSelect.value : "All";

  let filteredList = allExpenses;
  if (selectedCategory !== "All") {
    filteredList = allExpenses.filter(
      (item) => item.category === selectedCategory,
    );
  }
  renderTable(filteredList);
  renderSummary(filteredList);
  updateChart(filteredList);
}

let myChart = null;

// دالة الحصول على اللون بحسب الفئة
function getCategoryColor(category) {
  const badgeClass = getCategoryByBadgeClass(category);

  switch (badgeClass) {
    case "bg-success":   return "#198754"; // Green - Food
    case "bg-primary":   return "#0d6efd"; // Blue - Transport
    case "bg-warning":   return "#ffc107"; // Yellow - Bills
    case "bg-danger":    return "#dc3545"; // Red - Entertainment
    case "bg-secondary": return "#6c757d"; // Gray - Others
    default:             return "#212529"; // Dark
  }
}

function initChart() {
  const chartCanvas = document.getElementById("expensesChart");
  if (!chartCanvas) return;

  // إذا كان هناك رسم بياني قديم مخزن ادمرهً
  const existingChart = Chart.getChart(chartCanvas); 
  if (existingChart) {
    existingChart.destroy();
  }

  myChart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "Expenses ($)",
        data: [],
        backgroundColor: [],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

//  تحديث البيانات فقط داخل الرسم البياني
function updateChart(list) {
  //اذا ما كان موجود اهيئه
  if (!myChart) {
    initChart();
  }

  if (!myChart) return;

  // تجميع مبالغ كل فئة
  const categoryTotals = {};

  (list || []).forEach(item => {
    const category = item.category || "Others";
    const amount = parseFloat(item.amount) || 0;

    if (categoryTotals[category]) {
      categoryTotals[category] += amount;
    } else {
      categoryTotals[category] = amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const bgColors = labels.map(cat => getCategoryColor(cat));

  // تحديث بيانات الـ Chart
  myChart.data.labels = labels;
  myChart.data.datasets[0].data = data;
  myChart.data.datasets[0].backgroundColor = bgColors;

  // إجبار الرسم البياني على إعادة الرسم
  myChart.update();
}
//dark mode code
const toggleBtn = document.getElementById('themeToggleBtn');

// اتأكد من الاختيار الاولي للشاشة dark or light
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  toggleBtn.textContent = '☀️ Light Mode';
}

// الاستجابة لضغطة الزر
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  
  const isDark = document.body.classList.contains('dark-mode');
  
  // تغيير نص الزر وحفظ الاختيار
  toggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

//اضافة خاصية تصدير المصاريف كملف CSV
document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

function exportToCSV() {
  //  التحقق من وجود مصاريف لتصديرها
  if (!allExpenses || allExpenses.length === 0) {
    alert('No expenses available to export!');
    return;
  }

  //تحديد رؤوس أعمدة الـ CSV
  const headers = ['Title', 'Amount ($)', 'Category', 'Date'];
  
  //تحويل المصفوفة إلى أسطر نصية بصيغة CSV
  const csvRows = [];
  
  // إضافة سطر العناوين
  csvRows.push(headers.join(','));

  // إضافة بيانات كل مصروف
  allExpenses.forEach(exp => {
    // تنظيف البيانات لو احتوت على فواصل كي لا تخرب تنسيق الـ CSV
    const title = `"${exp.title || ''}"`;
    const amount = exp.amount || 0;
    const category = `"${exp.category || ''}"`;
    const date = `"${(exp.date || '').replace(/"/g, '""')}"`;

    const row = [title, amount, category ,date];
    csvRows.push(row.join(','));
  });

  // 4. دمج جميع الأسطر بنص واحد يفصل بينها سطر جديد
  const csvString = csvRows.join('\n');

  // 5. إنشاء Blob وتنزيل الملف تلقائياً
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_report_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
//اضافة خاصية حذف كل المصاريف مرة وحدة 
const deleteAll=document.getElementById("deleteAllBtn").addEventListener('click',deleteAllExpenses);
function deleteAllExpenses() {
  if (!allExpenses || allExpenses.length === 0) {
    alert("No expenses to delete!");
    return;
  }
  const isConfirmed = confirm("Are you sure you want to delete all expenses? This action cannot be undone.");

  if (isConfirmed) {
     
    allExpenses = [];
    
    refresh(); 
    
    alert("All expenses have been deleted successfully.");
  }
}


const API_URL = "http://localhost:3000/api/expenses";
