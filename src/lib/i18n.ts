export interface TranslationKeys {
    system:{
        addedSuccessfully: string;
        updatedSuccessfully: string;
        errorOccurred: string;
        validationError: string;
        validationErrors: string;
        yes: string;
        no: string;
        confirmation: string;
        areYouSure: string;
        closeDialog: string;
        changeTheme: string;
        changeLang: string;
        loading: string;
        errorConnection: string;
        describeProblem: string;
        success: string;
        dbError: string;
    };

    validation: {
        selectImage: string;
        selectPropertyType: string;
        locationRequired: string;
        locationLength: string;
        areaRequired: string;
        areaBetween: string;
        titleRequired: string;
        titleLength: string;
        selectStatementType: string;
        priceRequired: string;
        priceBetween: string;
        contentRequired: string;
        contentLength: string;
        descriptionRequired: string;
        descriptionLength: string;
        passwordChanged: string;
        wrongPassword: string;
        emailChanged: string;
        wrongEmail: string;
        phoneChanged: string;
        wrongPhone: string;
        loginLength: string;
        nameLength: string;
        surenameLength: string;
        emailError: string;
        phoneError: string;
        ageBetween: string;
        passwordError: string;
        repeatPasswordError: string;
        userNotFound: string;
        loginError: string;
        loginNotExist: string;
    };

    header:{
        lang_ua: string;
        lang_en: string;
        theme_dark: string;
        theme_light: string;
        page_main: string;
        page_offers: string;
        page_reports: string;
        page_chats: string;
        logout: string;
        login: string;
    };

    unauthorized: {
        title: string;
        message: string;
        loginBtn: string;
    };

    authorized: {
        title: string;
        name: string;
        online: string;
        hello: string;
        welcome: string;
        roles: string;
    };

    chats: {
        myChats: string;
        messages: string;
        selectContact: string;
        typeMessage: string;
        noMessages: string;
    };

    authorization: {
        realEstate: string;
        login: string;
        password: string;
        dontHaveAcc: string;
        name: string;
        surname: string;
        email: string;
        phoneNumber: string;
        age: string;
        repeatPassword: string;
        alreadyHaveAcc: string;
        loginBtn: string;
        registerBtn: string;
        loginConfirmBtn: string;
        registerConfirmBtn: string;
        loginError: string;
        checkFields: string;
        chooseImage: string;
        loginAlreadyExist: string;
    };
    offers: {
        leaveComment: string;
        verified: string;
        unverified: string;
        verify: string;
        unverify: string;
        price: string;
        statementType: string;
        propertyType: string;
        location: string;
        floors: string;
        rooms: string;
        area: string;
        sqm: string;
        content: string;
        description: string;
        author: string;
        createdAt: string;
        contactRealtor: string;
        deleteAnnouncement: string;
        typeAnswer: string;
        typeQuestion: string;
        answerQuestion: string;
        askQuestion: string;
        commentBack: string;
        comments: string;
        questions: string;
        searchProperties: string;
        filters: string;
        filterBy: string;
        clearAll: string;
        sort: string;
        sortBy: string;
        search: string;
        review: string;
        images: string;
        main_photo: string;
        update: string;
        create: string;
        searchStatementType: string;
        title: string;
        searchPropertyType: string;
        ok: string;
        reasonForComplain: string;
        complaintSent: string;
        notes: string;
        complain: string;
        unfavorite: string;
        favorite: string;
        inFavorite: string;
        addInFavorite: string;
        clickToEnlarge: string;
        viewsCnt: string;
        edit: string;
        creatingDialogueError: string;
        dialogueCreatedSuccessfully: string;
        unverifyError: string;
        verifyError: string;
        unverifiedSuccessfully: string;
        verifiedSuccessfully: string;
        unfavoriteError: string;
        favoriteError: string;
        unfavoriteSuccessfully: string;
        favoriteSuccessfully: string;
        deletingError: string;
        deletedSuccessfully: string;
        fakePhotos: string;
        fraud: string;
        spam: string;
        alreadySold: string;
        incorrectPrice: string;
        wrongLocation: string;
        offensiveContent: string;
        unprofessionalBehaviour: string;
        duplicateListing: string;
        other: string;
        priceByDesc: string;
        priceByAsc: string;
        areaByDesc: string;
        areaByAsc: string;
        roomsByDesc: string;
        roomsByAsc: string;
        floorsByDesc: string;
        floorsByAsc: string;
        rent: string;
        lease: string;
        sale: string;
        apartment: string;
        house: string;
        commercial: string;
        office: string;
        warehouse: string;
        land: string;
        room: string;
    };

    reports: {
        searchFilters: string;
        general: string;
        client: string;
        useDateSpan: string;
        date: string;
        dateFrom: string;
        dateTo: string;
        clientLogin: string;
        clear: string;
        form: string;
        report: string;
        completedDeals: string;
        totalProfit: string;
        topDeal: string;
        name: string;
        statementType: string;
        price: string;
        realtor: string;
        customer: string;
        soldDate: string;
        topRealtors: string;
        deals: string;
        profit: string;
        propertyTypes: string;
        type: string;
        count: string;
        avgPrice: string;
        topClients: string;
        spent: string;
        back: string;
        placedAnnouncements: string;
        sold: string;
        topRealtor: string;
        earned: string;
        topClient: string;
    },

    personal: {
        profile: string;
        stats: string;
        announcements: string;
        edit: string;
        placed: string;
        sold: string;
        bought: string;
        favorite: string;
        oldPassword: string;
        newPassword: string;
        changePassword: string;
        newEmail: string;
        changeEmail: string;
        newPhoneNumber: string;
        changePhoneNumber: string;
        registerDate: string;
        numAnnouncementPlaced: string;
        numAnnouncementSold: string;
        numAnnouncementBought: string;
        numDays: string;
        numPayments: string;
        numQuestions: string;
        numAnswers: string;
        numComments: string;
        earned: string;
        spent: string;
        change: string;
        image: string;
    }
}

export type Language = 'UA' | 'EN';

export const translations: Record<Language, TranslationKeys> = {
    UA: {
        system: {
            addedSuccessfully: "Успішно додано!",
            updatedSuccessfully: "Updated successfully!",
            errorOccurred: "Виникла помилка",
            validationError: "Помилка валідації",
            validationErrors: "Помилки валідації",
            yes: "Так",
            no: "Ні",
            confirmation: "Підтвердження",
            areYouSure: "Ви впевнені?",
            closeDialog: "Закрити діалог",
            changeLang: "Змінити мову",
            changeTheme: "Змінити тему",
            loading: "Завантаження...",
            errorConnection: "Перевірте підключення до інтернету",
            describeProblem: "Опишіть проблему, будь ласка",
            success: "Успіх",
            dbError: "Помилка бази даних"
        },
        validation: {
            selectImage: 'Оберіть зображення, будь ласка',
            selectPropertyType: 'Оберіть тип власності, будь ласка',
            locationRequired: "Локація обов'язковаLocation is required",
            locationLength: 'Довжина локації повинна бути 3-100',
            areaRequired: 'Площа обов`язкова',
            areaBetween: 'Площа повинна бути від 1 до 999999',
            titleRequired: "Заголовок обов'язковий",
            titleLength: 'Заголовок повинен бути коротший за 100',
            selectStatementType: 'Оберіть тип оголошення, будь ласка',
            priceRequired: "Ціна обов'язкова",
            priceBetween: 'Ціна повинна бути від 1 до 99999999',
            contentRequired: 'Вміст обов`язковий',
            contentLength: 'Вмість повинен бути коротший за 255',
            descriptionRequired: 'Опис обов`язковий',
            descriptionLength: 'Опис повинен бути коротшим за 500',
            passwordChanged: 'Успішна зміна паролю!',
            wrongPassword: 'Неправильний пароль!',
            emailChanged: 'Пошта змінена успішно!',
            wrongEmail: 'Неправильна пошта!',
            phoneChanged: 'Номер телефону змінений успішно!',
            wrongPhone: 'Неправильний номер телефону!',
            loginLength: "Довжина логіну повинна бути 3-50",
            nameLength: "Довжина імені повинна бути 3-50",
            surenameLength: "Прізвище повинно бути 3-50",
            emailError: "Помилка пошти. Приклад: test@ukr.net",
            phoneError: "Помилка номеру телефона. Приклад: +380123456789",
            ageBetween: "Вік повинен бути 1-130",
            passwordError: "Помилка паролю",
            repeatPasswordError: "Помилка повтору пароля",
            userNotFound: "Користувача не знайдено",
            loginError: "Помилка логіну",
            loginNotExist: "Логін не існує"
        },
        header:{
            lang_ua: "Укр",
            lang_en: "Англ",
            theme_dark: "Темна",
            theme_light: "Світла",
            page_main: "Головна",
            page_offers: "Пропозиції",
            page_reports: "Звіти",
            page_chats: "Чати",
            logout: "Вийти",
            login: "Увійти"
        },
        unauthorized: {
            title: "Доступ обмежено",
            message: "Вам потрібно увійти, щоб отримати доступ до кабінету агентства",
            loginBtn: "Увійти"
        },
        authorized: {
            title: "Агенство керування нерухомістю",
            online: "У мережі",
            hello: "Привіт",
            welcome: "Ласкаво просимо до агенства керування нерухомістю",
            roles: "Ролі",
            name: 'Користувач'
        },
        chats: {
            myChats: 'Мої чати',
            messages: 'Повідомлення',
            selectContact: 'Оберіть контакт зі списку для початку діалогу.',
            typeMessage: 'Ваше повідомлення...',
            noMessages: 'Ще немає повідомлень. Почніть розмову!'
        },
        authorization: {
            realEstate: 'Агенство керування нерухомістю',
            login: 'Логін',
            password: 'Пароль',
            dontHaveAcc: "Немає акаунту?",
            name: "Ім'я",
            surname: "Прізвище",
            email: "Електронна пошта",
            phoneNumber: "Номер телефону",
            age: "Вік",
            repeatPassword: "Повторіть пароль",
            alreadyHaveAcc: "Вже є акаунт?",
            loginBtn: "Авторизація",
            registerBtn: "Реєстрація",
            loginConfirmBtn: "Авторизуватися",
            registerConfirmBtn: "Зареєструватися",
            loginError: "Помилка авторизації",
            checkFields: "Перевірте поля та спробуйте знов, юудь ласка",
            chooseImage: 'Оберіть фотографію',
            loginAlreadyExist: "Логін вже існує"
        },
        offers: {
            leaveComment: "Залишити коментар",
            verified: "Верифіковано",
            unverified: "Неверифіковано",
            verify: "Верифікувати",
            unverify: "Деверифікувати",
            price: "Вартість",
            statementType: "Тип оголошення",
            propertyType: "Тип власності",
            location: "Адреса",
            floors: "Поверхи",
            rooms: "Кімнати",
            area: "Площа",
            content: "Вміст",
            sqm: "кв.м.",
            description: "Опис",
            author: "Автор",
            createdAt: "Створено",
            contactRealtor: "Зв'язатися із рієлтором",
            deleteAnnouncement: "Видалити оголошення",
            typeAnswer: "Введіть відповідь",
            typeQuestion: "Введіть запитання",
            answerQuestion: "Відповісти",
            askQuestion: "Запитати",
            commentBack: "Переключитися на запитання",
            comments: "Коментарі",
            questions: "Запитання",
            searchProperties: "Знайти власність...",
            filters: "Фільтри",
            filterBy: "Фільтрувати за",
            clearAll: "Очистити все",
            sort: "Сортування",
            sortBy:"Сортувати за",
            search: "Пошук",
            review: "Перегляд",
            images: "Фотографії",
            main_photo: "Головна",
            update: "Оновити",
            create: "Створити",
            searchStatementType: "Знайти тип оголошення...",
            searchPropertyType: "Знайти тип власності...",
            title: "Заголовок",
            ok: "Ок",
            reasonForComplain: "Причина скарги",
            complaintSent: "Скаргу успішно відправлено",
            notes: "Замітки",
            complain: "Поскаржитись",
            unfavorite: "Прибрати з обраного",
            favorite: "Обране",
            inFavorite: "У обраному",
            addInFavorite: "Додати у обране",
            clickToEnlarge: "Натисніть щоб збільшити",
            viewsCnt: "Кількість переглядів",
            edit: "Редагувати",
            creatingDialogueError: "Помилка створення діалогу",
            dialogueCreatedSuccessfully: "Успішне створення діалогу",
            unverifyError: 'Помилка скасування верифікації',
            verifyError: 'Помилка верифікації',
            unverifiedSuccessfully: 'Успішне скасування верифікації',
            verifiedSuccessfully: 'Успішно верифіковано',
            unfavoriteError: 'Помилка скасування обраного',
            favoriteError: 'Помилка обраного',
            unfavoriteSuccessfully: 'Успішне скасування обраного',
            favoriteSuccessfully: 'Успішне додаванння у обране',
            deletingError: 'Помилка видалення',
            deletedSuccessfully: 'Успішне видалення',
            fakePhotos: 'Фальшиві фотографії',
            fraud: 'Шахрайство',
            spam: 'Спам',
            alreadySold: 'Вже продано',
            incorrectPrice: 'Неправильна ціна',
            wrongLocation: 'Неправильна локація',
            offensiveContent: 'Образливий вміст',
            unprofessionalBehaviour: 'Непрофесійна поведінка',
            duplicateListing: 'Дубльований запис',
            other: 'Інше',
            priceByDesc: 'Ціна за спаданням',
            priceByAsc: 'Ціна за зростанням',
            areaByDesc: 'Площа за спаданням',
            areaByAsc: 'Площа за зростанням',
            roomsByDesc: 'Кімнати за спаданням',
            roomsByAsc: 'Кімнати за зростанням',
            floorsByDesc: 'Поверхи за спаданням',
            floorsByAsc: 'Поверхи за зростанням',
            rent: 'Оренда',
            lease: 'Лізинг',
            sale: 'Продаж',
            apartment: 'Квартири',
            house: 'Будинки',
            commercial: 'Комерційні',
            office: 'Офіси',
            warehouse: 'Склади',
            land: 'Землі',
            room: 'Кімнати',
        },
        reports: {
            searchFilters: 'Фільтри пошуку',
            general: 'Загальне',
            client: 'Клієнт',
            useDateSpan: 'Часовий проміжок',
            date: 'Дата',
            dateFrom: 'Дата з',
            dateTo: 'Дата по',
            clientLogin: 'Логін клієнта',
            clear: 'Очистити',
            form: 'Сформувати',
            report: "Звіт",
            completedDeals: "Завершені угоди",
            totalProfit: "Загальний прибуток",
            topDeal: "Найкраща угода",
            name: 'Ім`я',
            statementType: 'Тип оголошення',
            price: 'Ціна',
            realtor: 'Рієлтор',
            customer: 'Покупець',
            soldDate: 'Дата продажу',
            topRealtors: 'Топ рієлтори',
            deals: 'Угоди',
            profit: 'Прибуток',
            propertyTypes: 'Типи власностей',
            type: 'Тип',
            count: 'Кількість',
            avgPrice: 'Середня вартість',
            topClients: 'Топ клієнти',
            spent: 'Витрачено',
            back: 'Назад',
            placedAnnouncements: 'Розміщені оголошення',
            sold: 'Продано',
            topRealtor: 'Топ рієтор',
            earned: 'Зароблено',
            topClient: 'Топ клієнт'
        },
        personal: {
            profile: "Профіль",
            stats: "Статистика",
            announcements: "Оголошення",
            edit: "Редагувати",
            placed: "Розміщено",
            sold: "Продано",
            bought: "Придбано",
            favorite: 'Обране',
            oldPassword: "Старий пароль",
            newPassword: "Новий пароль",
            changePassword: "Змінити пароль",
            newEmail: "Нова пошта",
            changeEmail: "Змінити пошту",
            newPhoneNumber: "Новий номер телефону",
            changePhoneNumber: "Змінити номер телефону",
            registerDate: "Дата реєстрації",
            numAnnouncementPlaced: "Кількість розміщених оголошень",
            numAnnouncementSold: "Кількість проданих власностей",
            numAnnouncementBought: "Кількість придбаних власностей",
            numDays: "Кількість днів на сайті",
            numPayments: "Кількість платежів",
            numQuestions: "Кількість питань",
            numAnswers: "Кількість відповідей",
            numComments: "Кількість коментарів",
            earned: "Зароблено",
            spent: "Витрачено",
            change: "Змінити",
            image: 'Фото'
        }
    },
    EN: {
        system: {
            addedSuccessfully: "Added successfully!",
            updatedSuccessfully: "Updated successfully!",
            errorOccurred: "An error occurred",
            validationError: "Validation error",
            validationErrors: "Validation errors",
            yes: "Yes",
            no: "No",
            confirmation: "Confirmation",
            areYouSure: "Are you sure?",
            closeDialog: "Close dialog",
            changeLang: "Change lang",
            changeTheme: "Chsnge theme",
            loading: "Loading...",
            errorConnection: "Check your internet connection",
            describeProblem: "Please, describe the problem",
            success: "Success",
            dbError: "Database error"
        },
        validation: {
            selectImage: 'Please select an image',
            selectPropertyType: 'Please select a property type',
            locationRequired: 'Location is required',
            locationLength: 'Location length must be 3-100',
            areaRequired: 'Area is required',
            areaBetween: 'Area must be between 1 and 999999',
            titleRequired: 'Title is required',
            titleLength: 'Title length must be less than 100',
            selectStatementType: 'Please select a statement type',
            priceRequired: 'Price is required',
            priceBetween: 'Price must be between 1 and 99999999',
            contentRequired: 'Content is required',
            contentLength: 'Content length must be less than 255 characters',
            descriptionRequired: 'Description is required',
            descriptionLength: 'Description length must be less than 500',
            passwordChanged: 'Password changed successful!',
            wrongPassword: 'Wrong password!',
            emailChanged: 'Email changed successful!',
            wrongEmail: 'Wrong email!',
            phoneChanged: 'Phone changed successful!',
            wrongPhone: 'Wrong phone number!',
            loginLength: "Login length must be 3-50",
            nameLength: "Name length must be 3-50",
            surenameLength: "Surname length must be 3-50",
            emailError: "Email error. Example: test@ukr.net",
            phoneError: "Phone number error. Example: +380123456789",
            ageBetween: "Age must be between 1-130",
            passwordError: "Password error",
            repeatPasswordError: "Repeat password error",
            userNotFound: "User not found",
            loginError: "Login error",
            loginNotExist: "Login is not exist"
        },
        header:{
            lang_ua: "UA",
            lang_en: "EN",
            theme_dark: "Dark",
            theme_light: "Light",
            page_main: "Main",
            page_offers: "Offers",
            page_reports: "Reports",
            page_chats: "Chats",
            logout: "Logout",
            login: "Login"
        },
        unauthorized: {
            title: "Access is restricted",
            message: "You need to log in to access the real estate agency",
            loginBtn: "Log in"
        },
        authorized: {
            title: "Real Estate Agency",
            online: "Online",
            hello: "Hello",
            welcome: "Welcome to the Real Estate Agency",
            roles: "Roles",
            name: 'User'
        },
        chats: {
            myChats: 'My Chats',
            messages: 'Messages',
            selectContact: 'Select a contact from the list to start chatting with a realtor.',
            typeMessage: 'Type your message...',
            noMessages: 'No messages yet. Start a conversation!'
        },
        authorization: {
            realEstate: 'Real Estate Agency',
            login: 'Login',
            password: 'Password',
            dontHaveAcc: "Don't have an account?",
            name: "Name",
            surname: "Surname",
            email: "Email",
            phoneNumber: "Phone Number",
            age: "Age",
            repeatPassword: "Repeat password",
            alreadyHaveAcc: "Already have an account?",
            loginBtn: "Login",
            registerBtn: "Register",
            loginConfirmBtn: "Login",
            registerConfirmBtn: "Register",
            loginError: "Login error",
            checkFields: "Please, check the fields and try again",
            chooseImage: 'Choose Image',
            loginAlreadyExist: "User with this login already exists"
        },
        offers: {
            leaveComment: "Leave a Comment",
            verified: "Verified",
            unverified: "Unverified",
            verify: "Verify",
            unverify: "Unverify",
            price: "Price",
            statementType: "Statement type",
            propertyType: "Property type",
            location: "Location",
            floors: "Floors",
            rooms: "Rooms",
            area: "Area",
            content: "Content",
            sqm: "sq.m.",
            description: "Description",
            author: "Author",
            createdAt: "Created at",
            contactRealtor: "Contact to realtor",
            deleteAnnouncement: "Delete the announcement",
            typeAnswer: "Type an answer",
            typeQuestion: "Type a question",
            answerQuestion: "Answer the question",
            askQuestion: "Ask a question",
            commentBack: "Switch to comment back",
            comments: "Comments",
            questions: "Questions",
            searchProperties: "Search properties...",
            filters: "Filters",
            filterBy: "Filter by",
            clearAll: "Clear all",
            sort: "Sort",
            sortBy:"Sort by",
            search: "Search",
            review: "Review",
            images: "Photos",
            main_photo: "Main",
            update: "Update",
            create: "Create",
            searchStatementType: "Search statement type...",
            searchPropertyType: "Search property type...",
            title: "Title",
            ok: "Ok",
            reasonForComplain: "Reason for complain",
            complaintSent: "Complaint successfully sent",
            notes: "Notes",
            complain: "Complain",
            unfavorite: "Unfavorite",
            favorite: "Favorite",
            inFavorite: "In favorite",
            addInFavorite: "Add in favorite",
            clickToEnlarge: "Click to enlarge",
            viewsCnt: "Views count",
            edit: "Edit",
            creatingDialogueError: "Creating dialogue error",
            dialogueCreatedSuccessfully: "Dialogue created successfully",
            unverifyError: 'Unverify error',
            verifyError: 'Verify error',
            unverifiedSuccessfully: 'Unverified successfully',
            verifiedSuccessfully: 'Verified successfully',
            unfavoriteError: 'Unfavorite error',
            favoriteError: 'Favorite error',
            unfavoriteSuccessfully: 'UnfavoriteSuccessfully',
            favoriteSuccessfully: 'Favorite successfully',
            deletingError: 'Deleting error',
            deletedSuccessfully: 'Deleted successfully',
            fakePhotos: 'Fake photos',
            fraud: 'Fraud',
            spam: 'Spam',
            alreadySold: 'Already sold',
            incorrectPrice: 'IncorrectPrice',
            wrongLocation: 'Wrong location',
            offensiveContent: 'Offensive content',
            unprofessionalBehaviour: 'UnprofessionalBehaviour',
            duplicateListing: 'DuplicateListing',
            other: 'Other',
            priceByDesc: 'Price by desc',
            priceByAsc: 'Price by asc',
            areaByDesc: 'Area by desc',
            areaByAsc: 'Area by asc',
            roomsByDesc: 'Rooms by desc',
            roomsByAsc: 'Rooms by asc',
            floorsByDesc: 'Floors by desc',
            floorsByAsc: 'Floors by asc',
            rent: 'For rent',
            lease: 'For lease',
            sale: 'For sale',
            apartment: 'Apartment',
            house: 'House',
            commercial: 'Commercial',
            office: 'Office',
            warehouse: 'Warehouse',
            land: 'Lands',
            room: 'Rooms',
        },

        reports: {
            searchFilters: 'Search filters',
            general: 'General',
            client: 'Client',
            useDateSpan: 'Use date span',
            date: 'Date',
            dateFrom: 'Date from',
            dateTo: 'Date to',
            clientLogin: 'Client`s login',
            clear: 'Clear',
            form: 'Form',
            report: "Report",
            completedDeals: "Completed deals",
            totalProfit: "Total profit",
            topDeal: "Top deal",
            name: 'Name',
            statementType: 'Statement type',
            price: 'Price',
            realtor: 'Realtor',
            customer: 'Customer',
            soldDate: 'Sold date',
            topRealtors: 'Top realtors',
            deals: 'Deals',
            profit: 'Profit',
            propertyTypes: 'Property types',
            type: 'Type',
            count: 'Count',
            avgPrice: 'Average price',
            topClients: 'Top clients',
            spent: 'Spent',
            back: 'Back',
            placedAnnouncements: 'Placed announcements',
            sold: 'Sold',
            topRealtor: 'Top realtor',
            earned: 'Earned',
            topClient: 'Top client'
        },
        personal: {
            profile: "Profile",
            stats: "Stats",
            announcements: "Announcements",
            edit: "Edit",
            placed: "Placed",
            sold: "Sold",
            bought: "Bought",
            favorite: 'Favorite',
            oldPassword: "Old password",
            newPassword: "New password",
            changePassword: "Change password",
            newEmail: "New email",
            changeEmail: "Change email",
            newPhoneNumber: "New phone number",
            changePhoneNumber: "Change phone number",
            registerDate: "Register date",
            numAnnouncementPlaced: "Number of announcement placed",
            numAnnouncementSold: "Number of announcement sold",
            numAnnouncementBought: "Number of announcement bought",
            numDays: "Number of days on the site",
            numPayments: "Number of payments",
            numQuestions: "Number of questions",
            numAnswers: "Number of answers",
            numComments: "Number of comments",
            earned: "Earned",
            spent: "Spent",
            change: "Change",
            image: 'Photo'
        }
    }
};